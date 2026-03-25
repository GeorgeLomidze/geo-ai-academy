import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  ApiError,
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import {
  createAudioGenerationRecord,
  markAudioGenerationFailedAndRefund,
  markAudioGenerationSucceeded,
} from "@/lib/audio/generation";
import {
  BunnyStorageError,
  uploadToStorage,
  warnBunnyUnauthorizedOnce,
} from "@/lib/bunny/storage";
import { hasEnoughCredits } from "@/lib/credits/manager";
import { AUDIO_MODELS } from "@/lib/credits/pricing";
import {
  AUDIO_DIALOGUE_MODEL_ID,
  GEMINI_TTS_VOICES,
  GoogleTtsError,
  generateDialogue,
} from "@/lib/google/tts";
import { Prisma } from "@prisma/client";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

const bodySchema = z.object({
  styleInstructions: z.string().trim().max(400).default(""),
  temperature: z.number().min(0).max(2).default(1),
  segments: z
    .array(
      z.object({
        speaker: z.string().trim().min(1, "სპიკერის სახელი აუცილებელია"),
        text: z.string().trim().min(1, "ტექსტი აუცილებელია"),
        voice: z.enum(GEMINI_TTS_VOICES),
      })
    )
    .min(1, "მინიმუმ ერთი დიალოგი აუცილებელია"),
});

function getRouteErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.userMessage;
  }

  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    return "გენერაციის დროს მოხდა შეცდომა. სცადეთ თავიდან";
  }

  if (error instanceof GoogleTtsError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return "გენერაციის დროს მოხდა შეცდომა. სცადეთ თავიდან";
    }

    if (error.statusCode === 429) {
      return "ხმის სერვისი დროებით გადატვირთულია. სცადეთ ცოტა მოგვიანებით";
    }

    if (error.message.toLowerCase().includes("ორ სპიკერს")) {
      return "დიალოგი ამ ეტაპზე მაქსიმუმ ორ სპიკერს უჭერს მხარს";
    }

    if (error.statusCode >= 500) {
      return "ხმის სერვისი დროებით შეფერხებულია. სცადეთ თავიდან";
    }

    return "გენერაციის დროს მოხდა შეცდომა. გადაამოწმეთ შეყვანილი მონაცემები";
  }

  return "დროებითი შეფერხება. გთხოვთ სცადოთ მოგვიანებით";
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse({
        body: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია",
      });
    }

    const params = parsed.data;
    const uniqueSpeakers = new Set(params.segments.map((segment) => segment.speaker));
    if (uniqueSpeakers.size > 2) {
      return validationErrorResponse({
        segments: "დიალოგი მაქსიმუმ ორ სპიკერს უჭერს მხარს",
      });
    }

    const model = AUDIO_MODELS[AUDIO_DIALOGUE_MODEL_ID];

    const hasCredits = await hasEnoughCredits(auth.userId, model.coins);
    if (!hasCredits) {
      throw new ApiError(400, "კრედიტები არ არის საკმარისი");
    }

    const generation = await createAudioGenerationRecord({
      userId: auth.userId,
      modelId: AUDIO_DIALOGUE_MODEL_ID,
      modelName: model.name,
      creditsCost: model.coins,
      prompt: params.segments
        .map((segment) => `${segment.speaker}: ${segment.text}`)
        .join("\n"),
    });

    try {
      const result = await generateDialogue(
        params.segments,
        params.styleInstructions,
        AUDIO_DIALOGUE_MODEL_ID,
        params.temperature
      );

      let outputUrl: string | null = null;

      try {
        outputUrl = await uploadToStorage(
          result.audioBuffer,
          `generations/audio/${auth.userId}/${generation.id}.${result.extension}`
        );
      } catch (storageError) {
        if (storageError instanceof BunnyStorageError && storageError.statusCode === 401) {
          warnBunnyUnauthorizedOnce("audio dialogue fallback");
        } else {
          console.warn("POST /api/ai/audio/dialogue storage fallback", storageError);
        }
      }

      const inlineAudioData = outputUrl
        ? null
        : `data:${result.mimeType};base64,${arrayBufferToBase64(result.audioBuffer)}`;

      await markAudioGenerationSucceeded({
        generationId: generation.id,
        outputUrl,
        outputData: {
          styleInstructions: params.styleInstructions,
          temperature: params.temperature,
          segments: params.segments,
          inlineAudioData,
        },
      });

      return NextResponse.json({
        generationId: generation.id,
        status: "SUCCEEDED",
        outputUrl: outputUrl ?? inlineAudioData,
        outputText: null,
        outputData: inlineAudioData ? { inlineAudioData } : null,
        creditsUsed: generation.creditsCost,
      });
    } catch (error) {
      const message = getRouteErrorMessage(error);

      await markAudioGenerationFailedAndRefund({
        userId: auth.userId,
        generationId: generation.id,
        creditsCost: generation.creditsCost,
        modelId: AUDIO_DIALOGUE_MODEL_ID,
        reason: message,
      });

      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error, "POST /api/ai/audio/dialogue failed");
    }

    const statusCode =
      error instanceof GoogleTtsError && error.statusCode >= 400 && error.statusCode < 500
        ? error.statusCode
        : 500;

    return handleApiError(
      new ApiError(statusCode, getRouteErrorMessage(error)),
      "POST /api/ai/audio/dialogue failed"
    );
  }
}
