import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validationErrorResponse } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const urlParam = request.nextUrl.searchParams.get("url");
    const filenameParam = request.nextUrl.searchParams.get("filename");

    if (!urlParam) {
      return validationErrorResponse({ url: "ჩამოსატვირთი ფაილი ვერ მოიძებნა" });
    }

    let assetUrl: URL;
    try {
      assetUrl = new URL(urlParam);
    } catch {
      return validationErrorResponse({ url: "ფაილის ბმული არასწორია" });
    }

    if (!["http:", "https:"].includes(assetUrl.protocol)) {
      return validationErrorResponse({ url: "ფაილის ბმული არასწორია" });
    }

    const upstreamResponse = await fetch(assetUrl.toString(), {
      cache: "no-store",
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return NextResponse.json(
        { error: "ფაილის გადმოწერა ვერ მოხერხდა" },
        { status: 502 },
      );
    }

    const contentType =
      upstreamResponse.headers.get("content-type") ?? "application/octet-stream";
    const safeFilename = sanitizeFilename(
      filenameParam || assetUrl.pathname.split("/").pop() || "download",
    );

    return new NextResponse(upstreamResponse.body, {
      headers: {
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/projects/download failed");
  }
}
