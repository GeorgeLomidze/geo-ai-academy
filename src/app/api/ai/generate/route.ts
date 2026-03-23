import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod/v4";
import {
  ApiError,
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { deductCreditsWithClient, hasEnoughCredits } from "@/lib/credits/manager";
import { getModelMetadata, getModelPrice } from "@/lib/credits/pricing";
import {
  getKieModelConfig,
  KieApiError,
  generateImage,
  generateImageFromImage,
  generateVideo,
  generateVideoFromImage,
} from "@/lib/kie/client";
import { refundKieGenerationCredits } from "@/lib/kie/callback";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/constants";
import {
  fetchKieBalance,
  shouldSendLowBalanceAlert,
  markAlertSent,
} from "@/lib/kie/balance";
import { sendKieLowBalanceAlert } from "@/lib/email/send";

const generateSchema = z.object({
  model: z.string().min(1, "მოდელი აუცილებელია"),
  type: z.enum(["IMAGE", "VIDEO"], "ტიპი არასწორია"),
  prompt: z.string().optional(),
  imageUrl: z.string().url("სურათის მისამართი არასწორია").optional(),
  imageUrls: z
    .array(z.string().url("სურათის მისამართი არასწორია"))
    .optional(),
  endFrameUrl: z.string().url("ბოლო კადრის მისამართი არასწორია").optional(),
  videoUrl: z.string().url("ვიდეოს მისამართი არასწორია").optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

const SOURCE_IMAGE_MODEL_MAP = {
  nanobanana: "nanobanana_edit",
  nanobanana2: "nanobanana2_edit",
  nanobananapro: "nanobananapro_edit",
  seedream5lite: "seedream5lite_edit",
  grok_t2i: "grok_i2i",
} as const;

/**
 * Models that handle reference images natively via flat body params,
 * without needing a separate "edit" model variant.
 * Key = model id, value = the API parameter name for the image URL.
 */
const NATIVE_REFERENCE_MODELS: Record<string, { key: string; array: boolean }> = {
  openaiimage: { key: "filesUrl", array: true },
  flux: { key: "inputImage", array: false },
};

function resolveImageModel(model: string, hasSourceImage: boolean) {
  if (!hasSourceImage) {
    return model;
  }

  // Models with native reference image support don't need a separate edit model
  if (model in NATIVE_REFERENCE_MODELS) {
    return model;
  }

  return SOURCE_IMAGE_MODEL_MAP[model as keyof typeof SOURCE_IMAGE_MODEL_MAP] ?? model;
}

function buildKieCallbackUrl() {
  const baseUrl = new URL(siteConfig.url);
  const hostname = baseUrl.hostname.toLowerCase();
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local");

  if (isLocalhost) {
    return null;
  }

  const url = new URL("/api/ai/webhooks/kie", baseUrl);
  const secret = process.env.KIE_AI_WEBHOOK_SECRET;

  if (secret) {
    url.searchParams.set("token", secret);
  }

  return url.toString();
}

function getKieErrorMessage(error: KieApiError) {
  const details = error.details as
    | { msg?: unknown; message?: unknown; code?: unknown; data?: unknown }
    | undefined;

  const detailMessage =
    typeof details?.msg === "string"
      ? details.msg
      : typeof details?.message === "string"
        ? details.message
        : error.message;

  const normalized = detailMessage.toLowerCase();

  if (normalized.includes("image") && normalized.includes("format")) {
    return "ვიდეოს კადრებისთვის გამოიყენე PNG ან JPG სურათები";
  }

  if (normalized.includes("300") && normalized.includes("image")) {
    return "ვიდეოს კადრები მინიმუმ 300x300 უნდა იყოს";
  }

  if (normalized.includes("aspect") || normalized.includes("ratio")) {
    return "ვიდეოს საწყისი და ბოლო კადრები ერთნაირი პროპორციით უნდა იყოს";
  }

  if (normalized.includes("balance") || normalized.includes("insufficient") || normalized.includes("credit")) {
    return "KIE API ბალანსი არასაკმარისია. გთხოვთ დაუკავშირდეთ ადმინისტრატორს";
  }

  if (normalized.includes("key") || normalized.includes("auth") || normalized.includes("token") || normalized.includes("unauthorized")) {
    return "KIE API ავტორიზაცია ვერ მოხერხდა. გთხოვთ დაუკავშირდეთ ადმინისტრატორს";
  }

  if (normalized.includes("rate") && normalized.includes("limit")) {
    return "სერვისი დროებით გადატვირთულია. გთხოვთ სცადოთ მოგვიანებით";
  }

  // Include raw error detail for debugging unrecognized errors
  const debugSuffix = detailMessage !== error.message ? ` (${detailMessage})` : "";
  return `გენერაციის დაწყება ვერ მოხერხდა. კრედიტები დაგიბრუნდათ${debugSuffix}`;
}

function isRetryablePrismaTransactionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const body = await parseJsonBody(request);
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse({
        [String(parsed.error.issues[0]?.path[0] ?? "root")]:
          parsed.error.issues[0]?.message ?? "მონაცემები არასწორია",
      });
    }

    const { model, type, prompt, imageUrl, imageUrls, endFrameUrl, videoUrl, options } = parsed.data;
    const normalizedImageUrls = Array.from(
      new Set(
        (imageUrls ?? []).concat(imageUrl ? [imageUrl] : []).filter(Boolean)
      )
    );
    const primaryImageUrl = normalizedImageUrls[0];
    const effectiveModel =
      type === "IMAGE" ? resolveImageModel(model, normalizedImageUrls.length > 0) : model;
    const modelMetadata = getModelMetadata(effectiveModel);
    const kieModelConfig = getKieModelConfig(effectiveModel);
    const normalizedPrompt = prompt?.trim() ?? "";
    const klingHasFrames = effectiveModel === "kling3" && Boolean(primaryImageUrl || endFrameUrl);
    const veoHasFrames =
      (effectiveModel === "veo31" || effectiveModel === "veo31fast") &&
      Boolean(primaryImageUrl || endFrameUrl);
    const motionControlReady = effectiveModel === "kling3_motion" && Boolean(primaryImageUrl);

    if (!modelMetadata) {
      throw new ApiError(400, "არჩეული მოდელი არ მოიძებნა");
    }

    if (modelMetadata.type !== type) {
      throw new ApiError(400, "არჩეული მოდელი ამ ტიპს არ შეესაბამება");
    }

    if (!normalizedPrompt && !(type === "VIDEO" && (klingHasFrames || motionControlReady))) {
      throw new ApiError(400, "პრომპტი აუცილებელია");
    }

    if (endFrameUrl && !primaryImageUrl && (klingHasFrames || veoHasFrames)) {
      throw new ApiError(400, "ბოლო კადრის გამოყენებისთვის საწყისი კადრიც აუცილებელია");
    }

    const nativeRefConfig = NATIVE_REFERENCE_MODELS[effectiveModel];

    if (
      normalizedImageUrls.length > 0 &&
      type === "IMAGE" &&
      kieModelConfig.taskMode !== "image-to-image" &&
      !nativeRefConfig
    ) {
      throw new ApiError(400, "არჩეული მოდელი საცნობარო სურათს არ უჭერს მხარს");
    }

    if (
      (kieModelConfig.taskMode === "image-to-image" ||
        kieModelConfig.taskMode === "image-to-video") &&
      !primaryImageUrl
    ) {
      throw new ApiError(400, "საწყისი ფაილის მისამართი აუცილებელია");
    }

    if (kieModelConfig.taskMode === "video-to-video" && !videoUrl) {
      throw new ApiError(400, "საწყისი ვიდეოს მისამართი აუცილებელია");
    }

    // Resolution + duration aware pricing for video models
    const resolution =
      typeof options?.resolution === "string"
        ? options.resolution
        : typeof options?.quality === "string"
          ? options.quality
          : undefined;
    const durationStr = typeof options?.duration === "string" ? options.duration : undefined;
    const durationSec = durationStr ? Number.parseInt(durationStr, 10) : undefined;
    const coinsCost = getModelPrice(effectiveModel, resolution, durationSec) ?? modelMetadata.coins;

    const hasCredits = await hasEnoughCredits(auth.userId, coinsCost);
    if (!hasCredits) {
      throw new ApiError(400, "კრედიტები არ არის საკმარისი");
    }

    let generation: {
      id: string;
      type: "IMAGE" | "VIDEO" | "AUDIO";
      creditsCost: number;
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        generation = await prisma.$transaction(
          async (tx) => {
            const createdGeneration = await tx.generation.create({
              data: {
                userId: auth.userId,
                type,
                modelId: effectiveModel,
                prompt: normalizedPrompt || null,
                status: "PENDING",
                creditsCost: coinsCost,
                sourceUrl: primaryImageUrl ?? videoUrl ?? null,
              },
              select: {
                id: true,
                type: true,
                creditsCost: true,
              },
            });

            await deductCreditsWithClient(
              tx,
              auth.userId,
              coinsCost,
              `${modelMetadata.name} გენერაცია`,
              effectiveModel,
              createdGeneration.id
            );

            return createdGeneration;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          }
        );

        break;
      } catch (error) {
        if (attempt === 2 || !isRetryablePrismaTransactionError(error)) {
          throw error;
        }
      }
    }

    if (!generation!) {
      throw new ApiError(500, "გენერაციის დაწყება ვერ მოხერხდა");
    }

    try {
      const callbackUrl = buildKieCallbackUrl();
      const kieOptions = {
        ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        input: options,
        refund: {
          userId: auth.userId,
          generationId: generation.id,
          amount: coinsCost,
          modelUsed: effectiveModel,
        },
      };

      let task;

      if (type === "IMAGE") {
        if (normalizedImageUrls.length > 0 && nativeRefConfig) {
          // Models like GPT Image / Flux handle reference images via flat body params
          const refInput = {
            ...(kieOptions.input ?? {}),
            [nativeRefConfig.key]: nativeRefConfig.array
              ? normalizedImageUrls
              : primaryImageUrl,
          };
          task = await generateImage(effectiveModel, normalizedPrompt, {
            ...kieOptions,
            input: refInput,
          });
        } else if (normalizedImageUrls.length > 0) {
          task = await generateImageFromImage(
            effectiveModel,
            normalizedPrompt,
            normalizedImageUrls,
            kieOptions
          );
        } else {
          task = await generateImage(effectiveModel, normalizedPrompt, kieOptions);
        }
      } else {
        // Kling 3.0: first/last frame via image_urls array
        if (effectiveModel === "kling3" && primaryImageUrl) {
          const klingImageUrls = endFrameUrl
            ? [primaryImageUrl, endFrameUrl]
            : [primaryImageUrl];
          const klingInput = { ...(kieOptions.input ?? {}), image_urls: klingImageUrls };
          task = await generateVideo(effectiveModel, normalizedPrompt, {
            ...kieOptions,
            input: klingInput,
          });
        } else if ((effectiveModel === "veo31" || effectiveModel === "veo31fast") && primaryImageUrl) {
          const veoImageUrls = endFrameUrl
            ? [primaryImageUrl, endFrameUrl]
            : [primaryImageUrl];
          const veoInput = {
            ...(kieOptions.input ?? {}),
            imageUrls: veoImageUrls,
            generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
          };
          task = await generateVideo(effectiveModel, normalizedPrompt, {
            ...kieOptions,
            input: veoInput,
          });
        // Kling Motion Control: input_urls (character) + video_urls (reference video)
        } else if (effectiveModel === "kling3_motion" && primaryImageUrl) {
          // KIE API requires a prompt — use a sensible default when user omits it
          const motionPrompt = normalizedPrompt || "No distortion, character movements consistent with video";
          const motionInput = {
            ...(kieOptions.input ?? {}),
            ...(videoUrl ? { video_urls: [videoUrl] } : {}),
          };
          task = await generateVideoFromImage(effectiveModel, motionPrompt, primaryImageUrl, {
            ...kieOptions,
            input: motionInput,
          });
        } else if (primaryImageUrl) {
          task = await generateVideoFromImage(
            effectiveModel,
            normalizedPrompt,
            primaryImageUrl,
            kieOptions
          );
        } else if (videoUrl) {
          task = await generateVideoFromImage(
            effectiveModel,
            normalizedPrompt,
            videoUrl,
            kieOptions
          );
        } else {
          task = await generateVideo(effectiveModel, normalizedPrompt, kieOptions);
        }
      }

      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          externalId: task.taskId,
          status: "PROCESSING",
          errorMessage: null,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown generation error";

      console.error(
        "\n\n========== KIE TASK CREATION FAILED ==========\n",
        "Model:", effectiveModel,
        "\nKIE Model:", kieModelConfig.kieModel,
        "\nError Type:", error instanceof KieApiError ? "KieApiError" : (error as Error)?.constructor?.name,
        "\nMessage:", errorMessage,
        "\nStatus Code:", error instanceof KieApiError ? error.statusCode : "N/A",
        "\nFull Details:", error instanceof KieApiError ? JSON.stringify(error.details, null, 2) : "N/A",
        "\nImage URL:", primaryImageUrl,
        "\nImage URLs:", normalizedImageUrls,
        "\nVideo URL:", videoUrl,
        "\n===============================================\n\n"
      );

      try {
        await refundKieGenerationCredits(
          {
            userId: auth.userId,
            generationId: generation.id,
            amount: coinsCost,
            modelUsed: effectiveModel,
          },
          errorMessage
        );
      } catch (refundError) {
        console.error("[generate] Refund failed:", refundError);
      }

      if (error instanceof KieApiError) {
        throw new ApiError(500, getKieErrorMessage(error));
      }

      throw error;
    }

    // Fire-and-forget: check Kie.ai balance and alert admin if low
    void (async () => {
      try {
        if (!shouldSendLowBalanceAlert()) return;
        const balance = await fetchKieBalance();
        if (balance.lowBalance) {
          markAlertSent();
          await sendKieLowBalanceAlert(balance.credits);
        }
      } catch {
        // Non-critical — don't affect generation response
      }
    })();

    return NextResponse.json(
      {
        generationId: generation.id,
        status: "PROCESSING",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/ai/generate failed");
  }
}
