import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  badRequestResponse,
  handleApiError,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { createStorageClient, ensureBucket } from "@/lib/supabase/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
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
        file: "მხოლოდ JPEG, PNG, WebP და AVIF ფორმატებია ნებადართული",
      });
    }

    if (file.size > MAX_SIZE) {
      return validationErrorResponse({
        file: "ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს",
      });
    }

    const ext = EXT_MAP[file.type] ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

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
    return handleApiError(error, "POST /api/admin/upload-image failed");
  }
}
