import { Prisma, type CreditTransactionType, type PrismaClient } from "@prisma/client";
import { addCreditsWithClient } from "@/lib/credits/manager";
import { persistToBunnyStorage } from "@/lib/bunny/storage";
import { getVideoModelCoins } from "@/lib/credits/pricing";
import { prisma } from "@/lib/prisma";

type CreditDbClient = PrismaClient | Prisma.TransactionClient;

type KieCallbackData = {
  taskId?: string;
  task_id?: string;
  state?: string;
  failMsg?: string;
  resultJson?: string;
  /** Runway callback format */
  video_url?: string;
  video_id?: string;
  image_url?: string;
  response?: {
    result_urls?: string[];
    resultUrls?: string[];
    resultImageUrl?: string;
    originImageUrl?: string;
  };
  info?: {
    resultUrls?: string[];
    result_urls?: string[];
    output?: string[];
    outputUrl?: string;
    output_url?: string;
    resultImageUrl?: string;
    originImageUrl?: string;
  };
};

export type KieCallbackPayload = {
  code?: number;
  msg?: string;
  message?: string;
  data?: KieCallbackData;
};

export type KieRefundContext = {
  userId: string;
  generationId: string;
  amount: number;
  modelUsed?: string;
};

export type KieCallbackResult = {
  processed: boolean;
  taskId: string | null;
  status: "SUCCEEDED" | "FAILED" | "IGNORED";
  refunded: boolean;
  generationId?: string;
  outputUrl?: string | null;
  errorMessage?: string;
};

export type KieStatusSyncInput = {
  taskId: string;
  success: boolean;
  resultUrls?: string[];
  errorMessage?: string;
};

function extractTaskId(payload: KieCallbackPayload) {
  return payload.data?.taskId ?? payload.data?.task_id ?? null;
}

function extractErrorMessage(payload: KieCallbackPayload) {
  return (
    payload.data?.failMsg ??
    payload.msg ??
    payload.message ??
    "Kie.ai generation failed"
  );
}

function extractResultUrls(payload: KieCallbackPayload) {
  const data = payload.data;
  const directUrls = [
    ...(data?.info?.resultUrls ?? []),
    ...(data?.info?.result_urls ?? []),
    ...(data?.info?.output ?? []),
    ...(data?.response?.resultUrls ?? []),
    ...(data?.response?.result_urls ?? []),
  ].filter((value): value is string => typeof value === "string");

  if (directUrls.length > 0) {
    return directUrls;
  }

  // Runway callback: video_url at data level
  if (typeof data?.video_url === "string" && data.video_url.length > 0) {
    return [data.video_url];
  }

  const outputUrl =
    data?.info?.resultImageUrl ??
    data?.response?.resultImageUrl ??
    data?.info?.outputUrl ??
    data?.info?.output_url;
  if (typeof outputUrl === "string") {
    return [outputUrl];
  }

  if (!data?.resultJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(data.resultJson) as {
      resultUrls?: unknown;
      result_urls?: unknown;
      videos?: Array<{ url?: string }>;
      images?: Array<{ url?: string }>;
    };

    const jsonUrls = Array.isArray(parsed.resultUrls)
      ? parsed.resultUrls
      : Array.isArray(parsed.result_urls)
        ? parsed.result_urls
        : [];

    if (jsonUrls.length > 0) {
      return jsonUrls.filter((value): value is string => typeof value === "string");
    }

    return [...(parsed.images ?? []), ...(parsed.videos ?? [])]
      .map((item) => item.url)
      .filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function isSuccessPayload(payload: KieCallbackPayload) {
  const state = payload.data?.state?.toLowerCase();

  if (state === "success" || state === "succeeded") {
    return true;
  }

  if (typeof payload.code === "number") {
    return payload.code === 200;
  }

  return false;
}

async function refundKieGenerationCreditsWithClient(
  client: CreditDbClient,
  context: KieRefundContext,
  reason: string
) {
  if (context.amount <= 0) {
    return false;
  }

  const existingRefund = await client.creditTransaction.findFirst({
    where: {
      generationId: context.generationId,
      type: "REFUND" as CreditTransactionType,
    },
    select: { id: true },
  });

  if (existingRefund) {
    return false;
  }

  await addCreditsWithClient(
    client,
    context.userId,
    context.amount,
    "REFUND",
    `Kie.ai refund: ${reason}`,
    {
      generationId: context.generationId,
      modelUsed: context.modelUsed,
    }
  );

  return true;
}

export async function refundKieGenerationCredits(
  context: KieRefundContext,
  reason: string
) {
  return prisma.$transaction(async (tx) => {
    await tx.generation.update({
      where: { id: context.generationId },
      data: {
        status: "FAILED",
        errorMessage: reason,
      },
    });

    return refundKieGenerationCreditsWithClient(tx, context, reason);
  });
}

export async function handleKieCallback(payload: KieCallbackPayload): Promise<KieCallbackResult> {
  const taskId = extractTaskId(payload);

  if (!taskId) {
    return {
      processed: false,
      taskId: null,
      status: "IGNORED",
      refunded: false,
      errorMessage: "Missing Kie.ai task id",
    };
  }

  return prisma.$transaction(async (tx) => {
    const generation = await tx.generation.findUnique({
      where: { externalId: taskId },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        creditsCost: true,
        modelId: true,
        outputUrl: true,
        errorMessage: true,
      },
    });

    if (!generation) {
      return {
        processed: false,
        taskId,
        status: "IGNORED",
        refunded: false,
        errorMessage: "Generation not found",
      } satisfies KieCallbackResult;
    }

    if (isSuccessPayload(payload)) {
      return syncGenerationStatusWithClient(tx, generation, {
        taskId,
        success: true,
        resultUrls: extractResultUrls(payload),
      });
    }

    if (generation.status === "SUCCEEDED") {
      return {
        processed: true,
        taskId,
        status: "SUCCEEDED",
        refunded: false,
        generationId: generation.id,
        outputUrl: generation.outputUrl,
      } satisfies KieCallbackResult;
    }

    return syncGenerationStatusWithClient(tx, generation, {
      taskId,
      success: false,
      errorMessage: extractErrorMessage(payload),
    });
  });
}

type GenerationLookup = {
  id: string;
  userId: string;
  status: string;
  creditsCost: number;
  modelId: string;
  outputUrl: string | null;
  type: string;
  errorMessage: string | null;
};

export const VEO_4K_UPGRADE_PENDING_MARKER = "__veo_4k_upgrade_pending__";

export function isVeo4KUpgradeRequested(modelId: string, creditsCost: number) {
  if (modelId !== "veo31" && modelId !== "veo31fast") {
    return false;
  }

  return creditsCost === (getVideoModelCoins(modelId, "4K") ?? Number.NaN);
}

async function syncGenerationStatusWithClient(
  tx: CreditDbClient,
  generation: GenerationLookup,
  input: KieStatusSyncInput
): Promise<KieCallbackResult> {
  if (input.success) {
    if (
      isVeo4KUpgradeRequested(generation.modelId, generation.creditsCost) &&
      generation.errorMessage !== VEO_4K_UPGRADE_PENDING_MARKER
    ) {
      await tx.generation.update({
        where: { id: generation.id },
        data: {
          status: "PROCESSING",
          errorMessage: null,
        },
      });

      return {
        processed: true,
        taskId: input.taskId,
        status: "IGNORED",
        refunded: false,
        generationId: generation.id,
      };
    }

    const kieOutputUrl = input.resultUrls?.[0] ?? generation.outputUrl ?? null;

    // Save the Kie.ai URL immediately so the generation is marked as SUCCEEDED
    await tx.generation.update({
      where: { id: generation.id },
      data: {
        status: "SUCCEEDED",
        outputUrl: kieOutputUrl,
        errorMessage: null,
      },
    });

    // Persist to Bunny Storage in the background (non-blocking)
    // If it fails, the Kie.ai URL stays as a temporary fallback
    if (kieOutputUrl) {
      const genType = generation.type as "IMAGE" | "VIDEO";
      void persistToBunnyStorage(kieOutputUrl, genType, generation.userId, generation.id)
        .then(async (bunnyUrl) => {
          if (bunnyUrl) {
            await prisma.generation.update({
              where: { id: generation.id },
              data: { outputUrl: bunnyUrl },
            });
          }
        })
        .catch((err) => {
          console.error("[BunnyStorage] Background persist failed:", err);
        });
    }

    return {
      processed: true,
      taskId: input.taskId,
      status: "SUCCEEDED",
      refunded: false,
      generationId: generation.id,
      outputUrl: kieOutputUrl,
    };
  }

  if (generation.status === "SUCCEEDED") {
    return {
      processed: true,
      taskId: input.taskId,
      status: "SUCCEEDED",
      refunded: false,
      generationId: generation.id,
      outputUrl: generation.outputUrl,
    };
  }

  const errorMessage = input.errorMessage ?? "Kie.ai generation failed";

  await tx.generation.update({
    where: { id: generation.id },
    data: {
      status: "FAILED",
      errorMessage,
    },
  });

  const refunded = await refundKieGenerationCreditsWithClient(
    tx,
    {
      userId: generation.userId,
      generationId: generation.id,
      amount: generation.creditsCost,
      modelUsed: generation.modelId,
    },
    errorMessage
  );

  return {
    processed: true,
    taskId: input.taskId,
    status: "FAILED",
    refunded,
    generationId: generation.id,
    errorMessage,
  };
}

export async function syncGenerationStatus(input: KieStatusSyncInput) {
  return prisma.$transaction(async (tx) => {
    const generation = await tx.generation.findUnique({
      where: { externalId: input.taskId },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        creditsCost: true,
        modelId: true,
        outputUrl: true,
        errorMessage: true,
      },
    });

    if (!generation) {
      return null;
    }

    return syncGenerationStatusWithClient(tx, generation, input);
  });
}
