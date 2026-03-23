import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { fetchVoices } from "@/lib/kie/audio";

export async function GET() {
  try {
    const voices = await fetchVoices();

    return NextResponse.json(
      { voices },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return handleApiError(error, "GET /api/ai/audio/voices failed");
  }
}
