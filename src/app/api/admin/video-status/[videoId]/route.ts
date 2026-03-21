import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { getVideo } from "@/lib/bunny/client";

type RouteContext = { params: Promise<{ videoId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { videoId } = await context.params;

    if (!videoId || videoId.length < 10) {
      return NextResponse.json(
        { error: "არასწორი ვიდეო ID" },
        { status: 400 }
      );
    }

    const video = await getVideo(videoId);

    // Bunny status codes: 0-3 = processing, 4 = ready, 5-6 = failed
    let status: "processing" | "ready" | "failed";
    if (video.status === 4) {
      status = "ready";
    } else if (video.status >= 5) {
      status = "failed";
    } else {
      status = "processing";
    }

    return NextResponse.json({
      status,
      encodeProgress: video.encodeProgress ?? 0,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/video-status failed");
  }
}
