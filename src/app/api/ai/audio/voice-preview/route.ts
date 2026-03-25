import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import {
  getCdnUrl,
  storageFileExists,
  uploadToStorage,
} from "@/lib/bunny/storage";
import {
  AUDIO_TTS_MODEL_ID,
  GEMINI_TTS_VOICES,
  generateSpeech,
} from "@/lib/google/tts";

const PREVIEW_LIMIT = 20;
const PREVIEW_WINDOW_MS = 60 * 60 * 1000;
const previewRequestsByUser = new Map<string, number[]>();

const bodySchema = z.object({
  voice: z.enum(GEMINI_TTS_VOICES),
  name: z.string().trim().min(1).max(60),
});

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

function getPreviewPath(voice: (typeof GEMINI_TTS_VOICES)[number]) {
  return `previews/audio/voices/pro/${voice}.wav`;
}

function enforcePreviewRateLimit(userId: string) {
  const now = Date.now();
  const recentRequests = (previewRequestsByUser.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < PREVIEW_WINDOW_MS
  );

  if (recentRequests.length >= PREVIEW_LIMIT) {
    previewRequestsByUser.set(userId, recentRequests);
    throw new ApiError(429, "ხმის მოსმენის ლიმიტს მიაღწიეთ. სცადეთ მოგვიანებით");
  }

  recentRequests.push(now);
  previewRequestsByUser.set(userId, recentRequests);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    enforcePreviewRateLimit(auth.userId);

    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "მოთხოვნა არასწორია");
    }

    const previewPath = getPreviewPath(parsed.data.voice);

    try {
      if (await storageFileExists(previewPath)) {
        return NextResponse.json({
          audioUrl: getCdnUrl(previewPath),
        });
      }
    } catch (storageError) {
      console.warn("[VoicePreview] Failed to read Bunny cache", storageError);
    }

    const result = await generateSpeech(
      "გამარჯობა, ეს არის ჩემი ხმის მოკლე მაგალითი",
      `წაიკითხე ეს მოკლე მისალმება ბუნებრივი და სასიამოვნო ტონით. ხმის სახელი მომხმარებლისთვის არის ${parsed.data.name}.`,
      parsed.data.voice,
      AUDIO_TTS_MODEL_ID,
      1
    );

    try {
      const audioUrl = await uploadToStorage(result.audioBuffer, previewPath);
      return NextResponse.json({ audioUrl });
    } catch (storageError) {
      console.error("[VoicePreview] Failed to cache preview in Bunny Storage", storageError);

      return NextResponse.json({
        audioUrl: `data:${result.mimeType};base64,${arrayBufferToBase64(result.audioBuffer)}`,
      });
    }
  } catch (error) {
    return handleApiError(error, "POST /api/ai/audio/voice-preview failed");
  }
}
