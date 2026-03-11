import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";
import { createStorageClient, ensureBucket } from "@/lib/supabase/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_SIZE = 5 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "ფაილი არ არის არჩეული" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "მხოლოდ JPEG, PNG, WebP და AVIF ფორმატებია ნებადართული" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს" },
      { status: 400 }
    );
  }

  try {
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
      console.error("Q&A image upload error:", error.message);
      return NextResponse.json(
        { error: "სურათის ატვირთვა ვერ მოხერხდა" },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from("qa-images").getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error("POST /api/qa/upload-image failed", error);
    return NextResponse.json(
      { error: "სურათის ატვირთვა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
