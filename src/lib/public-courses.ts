import { prisma } from "@/lib/prisma";
import { getCourseRatingSummaries } from "@/lib/reviews";

export type PublicCourse = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
  moduleCount: number;
  lessonCount: number;
  averageRating: number | null;
  totalReviews: number;
};

export async function getPublicCourses(): Promise<PublicCourse[]> {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      thumbnailUrl: true,
      price: true,
      _count: {
        select: {
          modules: true,
        },
      },
      modules: {
        select: {
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      },
    },
  });

  const ratingSummaries = await getCourseRatingSummaries(
    courses.map((course) => course.id)
  );

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl,
    price: course.price,
    moduleCount: course._count.modules,
    lessonCount: course.modules.reduce(
      (sum, module) => sum + module._count.lessons,
      0
    ),
    averageRating: ratingSummaries[course.id]?.averageRating ?? null,
    totalReviews: ratingSummaries[course.id]?.totalReviews ?? 0,
  }));
}
