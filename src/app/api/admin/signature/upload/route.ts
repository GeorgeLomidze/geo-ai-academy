import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  badRequestResponse,
  handleApiError,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { createStorageClient, ensureBucket } from "@/lib/supabase/storage";
import { detectImageMime } from "@/lib/uploads/image-validation";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return badRequestResponse();
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return validationErrorResponse({ file: "ფაილი არ არის არჩეული" });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return validationErrorResponse({
        file: "მხოლოდ JPEG, PNG, WebP და GIF ფორმატებია ნებადართული",
      });
    }

    if (file.size > MAX_SIZE) {
      return validationErrorResponse({
        file: "ფაილის ზომა არ უნდა აღემატებოდეს 2MB-ს",
      });
    }

    const ext = EXT_MAP[file.type] ?? "png";
    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectImageMime(buffer);

    if (detectedMime !== file.type) {
      return validationErrorResponse({
        file: "ფაილის შიგთავსი არჩეულ ფორმატს არ ემთხვევა",
      });
    }

    const filename = `signatures/${randomUUID()}.${ext}`;

    const supabase = createStorageClient();
    await ensureBucket(supabase, "course-thumbnails");

    const { error } = await supabase.storage
      .from("course-thumbnails")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/signature/upload failed");
  }
}
