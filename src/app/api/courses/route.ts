import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { getPublicCourses } from "@/lib/public-courses";

export async function GET() {
  try {
    const courses = await getPublicCourses();
    return NextResponse.json(courses, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/courses failed");
  }
}
