import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: {
        modules: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    const result = courses.map((course) => {
      const lessonCount = course.modules.reduce(
        (sum, mod) => sum + mod.lessons.length,
        0
      );
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        price: course.price,
        status: course.status,
        lessonCount,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "კურსების ჩატვირთვა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
