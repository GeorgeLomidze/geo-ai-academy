import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { createVideo } from "@/lib/bunny/client";
import { getTusUploadUrl } from "@/lib/bunny/upload";
import { getVideoThumbnailUrl } from "@/lib/bunny/signed-url";

const uploadSchema = z.object({
  title: z.string().min(1, "ვიდეოს სახელი აუცილებელია"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const result = uploadSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        title: result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const video = await createVideo(result.data.title);
    const { uploadUrl, headers } = getTusUploadUrl(video.guid);

    return NextResponse.json({
      videoId: video.guid,
      uploadUrl,
      tusHeaders: headers,
      thumbnailUrl: getVideoThumbnailUrl(video.guid),
    });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/upload failed");
  }
}
