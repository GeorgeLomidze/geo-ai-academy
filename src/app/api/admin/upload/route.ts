import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/admin-auth";
import { createVideo } from "@/lib/bunny/client";
import { getTusUploadUrl } from "@/lib/bunny/upload";
import { getVideoThumbnailUrl } from "@/lib/bunny/signed-url";

const uploadSchema = z.object({
  title: z.string().min(1, "ვიდეოს სახელი აუცილებელია"),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const result = uploadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  try {
    const video = await createVideo(result.data.title);
    const { uploadUrl, headers } = getTusUploadUrl(video.guid);

    return NextResponse.json({
      videoId: video.guid,
      uploadUrl,
      tusHeaders: headers,
      thumbnailUrl: getVideoThumbnailUrl(video.guid),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "ვიდეოს შექმნა ვერ მოხერხდა";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
