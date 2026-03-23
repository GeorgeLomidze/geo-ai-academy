import { type CreditTransactionType, Prisma, type PrismaClient } from "@prisma/client";
import { addCreditsWithClient, deductCreditsWithClient } from "@/lib/credits/manager";
import { prisma, resetPrismaClient } from "@/lib/prisma";

type CreditDbClient = PrismaClient | Prisma.TransactionClient;

type CreateAudioGenerationInput = {
  userId: string;
  modelId: string;
  modelName: string;
  creditsCost: number;
  prompt: string | null;
};

type AudioGenerationResult = {
  id: string;
  creditsCost: number;
};

async function hasExistingRefund(
  client: CreditDbClient,
  generationId: string
) {
  const existingRefund = await client.creditTransaction.findFirst({
    where: {
      generationId,
      type: "REFUND" as CreditTransactionType,
    },
    select: {
      id: true,
    },
  });

  return Boolean(existingRefund);
}

function shouldRetryWithFreshPrismaClient(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientValidationError)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("invalid value for argument `type`") ||
    message.includes("expected generationtype") ||
    message.includes("outputtext") ||
    message.includes("outputdata") ||
    message.includes("audio")
  );
}

export async function createAudioGenerationRecord(
  input: CreateAudioGenerationInput
): Promise<AudioGenerationResult> {
  const runCreate = () =>
    prisma.$transaction(
      async (tx) => {
        const generation = await tx.generation.create({
          data: {
            userId: input.userId,
            type: "AUDIO",
            modelId: input.modelId,
            prompt: input.prompt,
            status: "PROCESSING",
            creditsCost: input.creditsCost,
          },
          select: {
            id: true,
            creditsCost: true,
          },
        });

        await deductCreditsWithClient(
          tx,
          input.userId,
          input.creditsCost,
          `${input.modelName} - აუდიო ინსტრუმენტი`,
          input.modelId,
          generation.id
        );

        return generation;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

  try {
    return await runCreate();
  } catch (error) {
    if (!shouldRetryWithFreshPrismaClient(error)) {
      throw error;
    }

    resetPrismaClient();
    return runCreate();
  }
}

export async function markAudioGenerationSucceeded(params: {
  generationId: string;
  outputUrl: string | null;
  outputText?: string | null;
  outputData?: Prisma.InputJsonValue | null;
}) {
  await prisma.generation.update({
    where: {
      id: params.generationId,
    },
    data: {
      status: "SUCCEEDED",
      outputUrl: params.outputUrl,
      outputText: params.outputText ?? null,
      outputData: params.outputData ?? undefined,
    },
  });
}

export async function markAudioGenerationFailedAndRefund(params: {
  userId: string;
  generationId: string;
  creditsCost: number;
  modelId: string;
  reason: string;
}) {
  await prisma.$transaction(
    async (tx) => {
      await tx.generation.update({
        where: {
          id: params.generationId,
        },
        data: {
          status: "FAILED",
          errorMessage: params.reason,
        },
      });

      if (await hasExistingRefund(tx, params.generationId)) {
        return;
      }

      await addCreditsWithClient(
        tx,
        params.userId,
        params.creditsCost,
        "REFUND",
        `აუდიო დაბრუნება: ${params.reason}`,
        {
          generationId: params.generationId,
          modelUsed: params.modelId,
        }
      );
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}
