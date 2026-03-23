import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  ApiError,
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { createAudioGenerationRecord, markAudioGenerationFailedAndRefund, markAudioGenerationSucceeded } from "@/lib/audio/generation";
import { hasEnoughCredits } from "@/lib/credits/manager";
import { AUDIO_MODELS } from "@/lib/credits/pricing";
import { GEMINI_TTS_MODEL_OPTIONS, GEMINI_TTS_VOICES, GoogleTtsError, generateSpeech } from "@/lib/google/tts";
import { uploadToStorage } from "@/lib/bunny/storage";
import { Prisma } from "@prisma/client";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

const bodySchema = z.object({
  text: z.string().trim().min(1, "ტექსტი აუცილებელია"),
  styleInstructions: z.string().trim().max(400).default(""),
  voice: z.enum(GEMINI_TTS_VOICES),
  model: z.enum(
    GEMINI_TTS_MODEL_OPTIONS.map((item) => item.id) as [
      (typeof GEMINI_TTS_MODEL_OPTIONS)[number]["id"],
      ...(typeof GEMINI_TTS_MODEL_OPTIONS)[number]["id"][],
    ]
  ),
  temperature: z.number().min(0).max(2).default(1),
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
      return "Google TTS დროებით გადატვირთულია. სცადეთ ცოტა მოგვიანებით";
    }

    if (error.statusCode >= 500) {
      return "Google TTS დროებით შეფერხებულია. სცადეთ თავიდან ან გამოიყენეთ Pro მოდელი";
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
    const model = AUDIO_MODELS[params.model];

    const hasCredits = await hasEnoughCredits(auth.userId, model.coins);
    if (!hasCredits) {
      throw new ApiError(400, "კრედიტები არ არის საკმარისი");
    }

    const generation = await createAudioGenerationRecord({
      userId: auth.userId,
      modelId: params.model,
      modelName: model.name,
      creditsCost: model.coins,
      prompt: params.text,
    });

    try {
      const result = await generateSpeech(
        params.text,
        params.styleInstructions,
        params.voice,
        params.model,
        params.temperature
      );

      let outputUrl: string | null = null;

      try {
        outputUrl = await uploadToStorage(
          result.audioBuffer,
          `generations/audio/${auth.userId}/${generation.id}.${result.extension}`
        );
      } catch (storageError) {
        console.warn("POST /api/ai/audio/tts storage fallback", storageError);
      }

      const inlineAudioData = outputUrl
        ? null
        : `data:${result.mimeType};base64,${arrayBufferToBase64(result.audioBuffer)}`;

      await markAudioGenerationSucceeded({
        generationId: generation.id,
        outputUrl,
        outputData: {
          styleInstructions: params.styleInstructions,
          voice: params.voice,
          temperature: params.temperature,
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
        modelId: params.model,
        reason: message,
      });

      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error, "POST /api/ai/audio/tts failed");
    }

    const statusCode =
      error instanceof GoogleTtsError && error.statusCode >= 400 && error.statusCode < 500
        ? error.statusCode
        : 500;

    return handleApiError(
      new ApiError(statusCode, getRouteErrorMessage(error)),
      "POST /api/ai/audio/tts failed"
    );
  }
}
