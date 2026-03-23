import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import {
  GEMINI_DIALOGUE_MODEL_OPTIONS,
  GEMINI_TTS_MODEL_OPTIONS,
  GEMINI_TTS_VOICES,
  type GeminiSingleSpeakerModelId,
  generateSpeech,
} from "@/lib/google/tts";

const modelIds = [
  ...GEMINI_TTS_MODEL_OPTIONS.map((item) => item.id),
  ...GEMINI_DIALOGUE_MODEL_OPTIONS.map((item) => item.id),
] as const;

const bodySchema = z.object({
  voice: z.enum(GEMINI_TTS_VOICES),
  model: z.enum(modelIds),
});

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "მოთხოვნა არასწორია");
    }

    const previewModel: GeminiSingleSpeakerModelId =
      parsed.data.model === "audio_tts_pro" || parsed.data.model === "audio_dialogue_pro"
        ? "audio_tts_pro"
        : "audio_tts_flash";

    const result = await generateSpeech(
      "გამარჯობა, მე ვარ ამ ხმის მოკლე მაგალითი.",
      "Read this short sample in a warm and natural tone.",
      parsed.data.voice,
      previewModel,
      1
    );

    const audioUrl = `data:${result.mimeType};base64,${arrayBufferToBase64(result.audioBuffer)}`;

    return NextResponse.json({
      audioUrl,
    });
  } catch (error) {
    return handleApiError(
      new ApiError(500, "ხმის მოსმენა დროებით ვერ მოხერხდა"),
      "POST /api/ai/audio/voice-preview failed"
    );
  }
}
