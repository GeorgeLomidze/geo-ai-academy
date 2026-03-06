import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  ArrowRight,
  GraduationCap,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { summarizeLessonCompletion } from "@/lib/learn-shared";

async function getDashboardData(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    take: 3,
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

  const totalEnrolled = await prisma.enrollment.count({
    where: { userId },
  });

  // Get all completed lessons for this user
  const completedProgress = await prisma.lessonProgress.findMany({
    where: { userId, completed: true },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  // Calculate per-course progress
  const courses = enrollments.map((enrollment) => {
    const { totalLessons, completedLessons, progressPercentage } =
      summarizeLessonCompletion(enrollment.course.modules, completedLessonIds);

    return {
      id: enrollment.course.id,
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      thumbnailUrl: enrollment.course.thumbnailUrl,
      totalLessons,
      completedLessons,
      progress: progressPercentage,
    };
  });

  // For total stats, we need all enrollments' courses
  const allEnrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: { select: { id: true } } },
          },
        },
      },
    },
  });

  let completedCourses = 0;
  let activeCourses = 0;
  for (const e of allEnrollments) {
    const { totalLessons: total, completedLessons: done } =
      summarizeLessonCompletion(e.course.modules, completedLessonIds);
    if (total > 0 && done === total) {
      completedCourses++;
    } else if (done > 0) {
      activeCourses++;
    }
  }

  return {
    courses,
    stats: {
      totalEnrolled,
      completedCourses,
      activeCourses,
    },
  };
}

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = user?.user_metadata?.name ?? "სტუდენტი";
  const dashboardData = user ? await getDashboardData(user.id) : null;
  const hasEnrollments = (dashboardData?.stats.totalEnrolled ?? 0) > 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        გამარჯობა, {name}!
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        კეთილი იყოს შენი მობრძანება სასწავლო პლატფორმაზე
      </p>

      {hasEnrollments && dashboardData ? (
        <>
          {/* Stats cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={BookOpen}
              label="ჩაწერილი კურსები"
              value={dashboardData.stats.totalEnrolled}
              color="primary"
            />
            <StatCard
              icon={PlayCircle}
              label="აქტიური კურსები"
              value={dashboardData.stats.activeCourses}
              color="accent"
            />
            <StatCard
              icon={CheckCircle2}
              label="დასრულებული"
              value={dashboardData.stats.completedCourses}
              color="success"
            />
          </div>

          {/* Latest enrolled courses */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-brand-secondary">
                ბოლო კურსები
              </h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-brand-primary hover:text-brand-primary-hover"
              >
                <Link href="/my-courses">
                  ყველას ნახვა
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardData.courses.map((course) => (
                <DashboardCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary-light">
            <BookOpen className="size-8 text-brand-primary" />
          </div>
          <h2 className="mt-5 font-display text-lg font-semibold text-brand-secondary">
            ჯერ არ გაქვს კურსები
          </h2>
          <p className="mt-2 max-w-sm text-sm text-brand-muted">
            დაათვალიერე ჩვენი კურსების კატალოგი და აირჩიე შენთვის სასურველი
            კურსი
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
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "primary" | "accent" | "success";
}) {
  const colorMap = {
    primary: {
      bg: "bg-brand-primary-light",
      icon: "text-brand-primary",
    },
    accent: {
      bg: "bg-brand-accent/10",
      icon: "text-brand-accent",
    },
    success: {
      bg: "bg-brand-success/10",
      icon: "text-brand-success",
    },
  };

  const colors = colorMap[color];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-5 transition-all duration-300 hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(245,166,35,0.1)]">
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}
      >
        <Icon className={`size-6 ${colors.icon}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-brand-secondary">{value}</p>
        <p className="text-sm text-brand-muted">{label}</p>
      </div>
    </div>
  );
}

function DashboardCourseCard({
  course,
}: {
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    totalLessons: number;
    completedLessons: number;
    progress: number;
  };
}) {
  return (
    <Link
      href={`/learn/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(245,166,35,0.1)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-brand-accent/10">
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
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary/15 backdrop-blur-sm">
              <GraduationCap className="size-6 text-brand-primary" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-sm font-bold leading-snug text-brand-secondary transition-colors group-hover:text-brand-primary">
          {course.title}
        </h3>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-muted">
              {course.completedLessons}/{course.totalLessons}
            </span>
            <span className="font-semibold text-brand-primary">
              {course.progress}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-500"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
