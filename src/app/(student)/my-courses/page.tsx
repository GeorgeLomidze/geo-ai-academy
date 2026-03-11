import Link from "next/link";
import Image from "next/image";
import { BookOpen, ArrowRight, PlayCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { summarizeLessonCompletion } from "@/lib/learn-shared";

export const metadata = {
  title: "ჩემი კურსები - GEO AI Academy",
};

async function getEnrolledCourses(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  // Get all lesson progress for this user
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId, completed: true },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

  return enrollments.map((enrollment) => {
    const { totalLessons, completedLessons, progressPercentage } =
      summarizeLessonCompletion(enrollment.course.modules, completedLessonIds);

    return {
      id: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      course: {
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        totalLessons,
        completedLessons,
        progress: progressPercentage,
      },
    };
  });
}

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const enrolledCourses = await getEnrolledCourses(user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        ჩემი კურსები
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        თქვენი ჩაწერილი კურსები და პროგრესი
      </p>

      {enrolledCourses.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary-light">
            <BookOpen className="size-8 text-brand-primary" />
          </div>
          <h2 className="mt-5 font-display text-lg font-semibold text-brand-secondary">
            ჯერ არ ხარ ჩაწერილი არცერთ კურსზე
          </h2>
          <p className="mt-2 max-w-sm text-sm text-brand-muted">
            დაათვალიერე ჩვენი კურსების კატალოგი და აირჩიე შენთვის სასურველი კურსი
          </p>
          <Button
            asChild
            className="mt-6 rounded-xl bg-brand-accent text-black hover:bg-brand-accent-hover"
          >
            <Link href="/courses">
              კურსების ნახვა
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledCourses.map((item) => (
            <EnrolledCourseCard key={item.id} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EnrolledCourseCardProps {
  course: {
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    totalLessons: number;
    completedLessons: number;
    progress: number;
  };
}

function EnrolledCourseCard({ course }: EnrolledCourseCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(245,166,35,0.1)]">
      {/* Thumbnail */}
      <Link
        href={`/learn/${course.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-brand-accent/10"
      >
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary/15 backdrop-blur-sm">
              <BookOpen className="size-7 text-brand-primary" />
            </div>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <PlayCircle className="size-12 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <Link href={`/learn/${course.slug}`}>
          <h3 className="font-display text-lg font-bold leading-snug text-brand-secondary transition-colors group-hover:text-brand-primary">
            {course.title}
          </h3>
        </Link>

        {/* Lesson count */}
        <p className="mt-2 text-xs text-brand-muted">
          {course.completedLessons} / {course.totalLessons} გაკვეთილი დასრულებული
        </p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-brand-muted">პროგრესი</span>
            <span className="font-semibold text-brand-primary">{course.progress}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-primary-light">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-500"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          asChild
          size="sm"
          className="mt-4 w-full rounded-xl bg-brand-primary text-black transition-all duration-200 hover:scale-[1.01] hover:bg-brand-primary-hover"
        >
          <Link href={`/learn/${course.slug}`}>
            {course.progress > 0 ? "გაგრძელება" : "დაწყება"}
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
