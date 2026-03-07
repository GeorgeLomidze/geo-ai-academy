import { NextRequest, NextResponse } from "next/server";
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
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "არასწორი მონაცემები" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ფაილი არ არის არჩეული" }, { status: 400 });
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
      console.error("Supabase storage upload error:", error.message);
      return NextResponse.json(
        { error: "ავატარის ატვირთვა ვერ მოხერხდა" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch {
    return NextResponse.json(
      { error: "ავატარის ატვირთვა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
