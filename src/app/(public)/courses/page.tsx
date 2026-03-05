import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseGrid } from "@/components/course/CourseGrid";

export const metadata = {
  title: "კურსების კატალოგი — GEO AI Academy",
  description: "შეარჩიე შენთვის სასურველი კურსი და დაიწყე სწავლა",
};

async function getPublishedCourses() {
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

  return courses.map((course) => ({
    ...course,
    lessonCount: course.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0
    ),
  }));
}

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {/* Page header */}
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-secondary sm:text-4xl">
          კურსების კატალოგი
        </h1>
        <p className="mt-3 text-base leading-relaxed text-brand-muted sm:text-lg">
          შეარჩიე შენთვის სასურველი კურსი და დაიწყე სწავლა დღესვე. ყველა კურსი
          ქართულ ენაზეა.
        </p>
      </div>

      {/* Courses grid or empty state */}
      {courses.length > 0 ? (
        <CourseGrid className="mt-12">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              slug={course.slug}
              shortDescription={course.shortDescription}
              thumbnailUrl={course.thumbnailUrl}
              price={course.price}
              lessonCount={course.lessonCount}
            />
          ))}
        </CourseGrid>
      ) : (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-brand-primary-light">
            <BookOpen className="size-9 text-brand-primary" />
          </div>
          <h2 className="mt-6 font-display text-xl font-bold text-brand-secondary">
            კურსები მალე დაემატება
          </h2>
          <p className="mt-2 max-w-md text-brand-muted">
            ჩვენ ვმუშაობთ ახალ კურსებზე. მალე შეძლებ სწავლის დაწყებას.
          </p>
        </div>
      )}
    </div>
  );
}
