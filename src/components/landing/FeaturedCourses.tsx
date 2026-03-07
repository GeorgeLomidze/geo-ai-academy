import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCourseRatingSummaries } from "@/lib/reviews";
import { CourseCard } from "@/components/course/CourseCard";
import { FeaturedCoursesClient } from "@/components/landing/FeaturedCoursesClient";

async function getFeaturedCourses() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 3,
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
    lessonCount: course.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0
    ),
    averageRating: ratingSummaries[course.id]?.averageRating ?? null,
    totalReviews: ratingSummaries[course.id]?.totalReviews ?? 0,
  }));
}

export async function FeaturedCourses() {
  const courses = await getFeaturedCourses();

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-brand-secondary backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <span className="size-2 rounded-full bg-brand-primary" />
                კურსები
              </span>
            </Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-secondary sm:text-4xl">
              პოპულარული კურსები
            </h2>
            <p className="mt-2 max-w-lg text-brand-muted">
              შეარჩიე შენთვის სასურველი კურსი და დაიწყე სწავლა დღესვე
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="text-brand-primary hover:text-brand-primary-hover"
          >
            <Link href="/courses">
              ყველა კურსი
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        {/* Course cards */}
        {courses.length > 0 ? (
          <FeaturedCoursesClient>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                slug={course.slug}
                shortDescription={course.shortDescription}
                thumbnailUrl={course.thumbnailUrl}
                price={course.price}
                lessonCount={course.lessonCount}
                averageRating={course.averageRating}
                totalReviews={course.totalReviews}
              />
            ))}
          </FeaturedCoursesClient>
        ) : (
          <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-brand-border py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary-light">
              <BookOpen className="size-7 text-brand-primary" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-brand-secondary">
              კურსები მალე დაემატება
            </h3>
            <p className="mt-2 max-w-sm text-sm text-brand-muted">
              ჩვენ ვმუშაობთ ახალ კურსებზე. მალე შეძლებ სწავლის დაწყებას.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
