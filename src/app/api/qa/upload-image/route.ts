import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  badRequestResponse,
  handleApiError,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { createStorageClient, ensureBucket } from "@/lib/supabase/storage";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return badRequestResponse();
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return validationErrorResponse({ file: "ფაილი არ არის არჩეული" });
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);

    if (!isImage && !isVideo) {
      return validationErrorResponse({
        file: "მხოლოდ JPEG, PNG, WebP, AVIF, MP4, WebM და MOV ფორმატებია ნებადართული",
      });
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return validationErrorResponse({
        file: isVideo
          ? "ვიდეოს ზომა არ უნდა აღემატებოდეს 50MB-ს"
          : "სურათის ზომა არ უნდა აღემატებოდეს 10MB-ს",
      });
    }

    const ext = EXT_MAP[file.type] ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createStorageClient();
    await ensureBucket(supabase, "qa-images");

    const { error } = await supabase.storage
      .from("qa-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("qa-images").getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return handleApiError(error, "POST /api/qa/upload-image failed");
  }
}
