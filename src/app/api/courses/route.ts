import { NextResponse } from "next/server";
import { getPublicCourses } from "@/lib/public-courses";

export async function GET() {
  try {
    const courses = await getPublicCourses();
    return NextResponse.json(courses);
  } catch {
    return NextResponse.json(
      { error: "კურსების ჩატვირთვა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
