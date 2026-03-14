import { NextRequest, NextResponse } from "next/server";
import {
  badRequestResponse,
  handleApiError,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { createStorageClient, ensureBucket } from "@/lib/supabase/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const MAX_SIZE = 5 * 1024 * 1024;

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

    const extension = EXTENSION_MAP[file.type] ?? "jpg";
    const filePath = `${auth.userId}/avatar.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createStorageClient();
    await ensureBucket(supabase, "avatars");

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    return handleApiError(error, "POST /api/profile/avatar failed");
  }
}
