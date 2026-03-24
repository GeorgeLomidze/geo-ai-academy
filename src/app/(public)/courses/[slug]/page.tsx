import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Clock,
  Layers,
  PlayCircle,
  FileText,
  Lock,
  Unlock,
  MessageSquareText,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatRatingValue } from "@/lib/review-constants";
import { getCourseReviewsSectionData } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PriceTag } from "@/components/course/PriceTag";
import { EnrollButton } from "@/components/course/EnrollButton";
import { BuyButton } from "@/components/course/BuyButton";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

const getCourse = unstable_cache(
  async (slug: string) => {
    return prisma.course.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                isFree: true,
              },
            },
          },
        },
        enrollments: {
          select: { userId: true },
        },
      },
    });
  },
  ["course-detail"],
  { revalidate: 600, tags: ["course"] }
);

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} სთ ${minutes > 0 ? `${minutes} წთ` : ""}`.trim();
  }
  return `${minutes} წთ`;
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "კურსი ვერ მოიძებნა" };
  return {
    title: `${course.title} - GEO AI Academy`,
    description: course.shortDescription ?? course.description ?? undefined,
  };
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { slug } = await params;
  const [course, supabase] = await Promise.all([getCourse(slug), createClient()]);
  if (!course) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isEnrolled = user
    ? course.enrollments.some((e) => e.userId === user.id)
    : false;
  const reviewData = await getCourseReviewsSectionData({
    courseId: course.id,
    currentUserId: user?.id ?? null,
    limit: 20,
  });

  // Stats
  const totalLessons = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0
  );
  const totalDuration = course.modules.reduce(
    (sum, mod) =>
      sum + mod.lessons.reduce((s, l) => s + (l.duration ?? 0), 0),
    0
  );
  const moduleCount = course.modules.length;

  return (
    <div className="bg-brand-background">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0A0A0A_0%,#171400_50%,#0A0A0A_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,214,10,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
            {/* Text content */}
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                {course.title}
              </h1>

              {course.shortDescription && (
                <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground sm:text-lg">
                  {course.shortDescription}
                </p>
              )}

              <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface/60 px-4 py-3 backdrop-blur-sm">
                {reviewData.summary.totalReviews > 0 ? (
                  <>
                    <StarRating
                      value={reviewData.summary.averageRating ?? 0}
                      size="sm"
                    />
                    <span className="font-semibold tabular-nums text-brand-secondary">
                      {formatRatingValue(reviewData.summary.averageRating ?? 0)}
                    </span>
                    <span className="text-sm text-foreground">
                      {reviewData.summary.totalReviews} შეფასება
                    </span>
                  </>
                ) : (
                  <>
                    <MessageSquareText className="size-4 text-foreground" />
                    <span className="text-sm text-foreground">
                      ჯერ შეფასებები არ არის
                    </span>
                  </>
                )}
              </div>

              <div className="mt-6 flex max-w-xl items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface/70 px-4 py-4 backdrop-blur-sm">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-brand-border">
                  <Image
                    src="/author.jpeg"
                    alt="გიორგი ლომიძე"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-secondary">
                    გიორგი ლომიძე
                  </p>
                  <p className="mt-1 text-sm leading-6 text-brand-muted text-pretty">
                    ვებ დეველოპერი / AI ტრენერი / 10+ წლიანი გამოცდილება
                    ტექნოლოგიებში
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-brand-muted">
                <span className="flex items-center gap-1.5">
                  <Layers className="size-4" />
                  {moduleCount} მოდული
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="size-4" />
                  {totalLessons} გაკვეთილი
                </span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {formatDuration(totalDuration)}
                  </span>
                )}
              </div>

              {/* CTA */}
              <div id="course-cta" className="mt-8 flex flex-wrap items-center gap-4">
                {isEnrolled ? (
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-xl bg-brand-accent px-8 text-base font-bold text-black transition-all duration-200 hover:scale-[1.02] hover:bg-brand-accent-hover"
                  >
                    <Link href={`/learn/${slug}`}>კურსის გაგრძელება</Link>
                  </Button>
                ) : user ? (
                  course.price > 0 ? (
                    <BuyButton
                      courseId={course.id}
                      price={course.price}
                      className="h-12 rounded-xl bg-brand-accent px-8 text-base font-bold text-black transition-all duration-200 hover:scale-[1.02] hover:bg-brand-accent-hover"
                    />
                  ) : (
                    <EnrollButton
                      courseId={course.id}
                      className="h-12 rounded-xl bg-brand-accent px-8 text-base font-bold text-black transition-all duration-200 hover:scale-[1.02] hover:bg-brand-accent-hover"
                    />
                  )
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-xl bg-brand-accent px-8 text-base font-bold text-black transition-all duration-200 hover:scale-[1.02] hover:bg-brand-accent-hover"
                    >
                      <Link href="/register">
                        {course.price > 0
                          ? `შეძენა ${course.price} ₾`
                          : "უფასო კურსის დაწყება"}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl border border-brand-border shadow-2xl lg:block">
              {course.thumbnailUrl ? (
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="400px"
                  priority
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-primary/30 via-brand-primary/15 to-brand-accent/15">
                  <div className="flex size-24 items-center justify-center rounded-3xl bg-brand-primary/20 backdrop-blur-sm">
                    <BookOpen className="size-12 text-brand-secondary/70" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-brand-background to-transparent" />
      </section>

      {/* Course content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          {/* Left: description + modules */}
          <div>
            {/* Description */}
            {course.description && (
              <div className="mb-12">
                <h2 className="font-display text-2xl font-bold text-brand-secondary">
                  კურსის აღწერა
                </h2>
                <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-brand-muted">
                  {course.description}
                </div>
              </div>
            )}

            {/* Modules accordion */}
            {moduleCount > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-brand-secondary">
                  კურსის პროგრამა
                </h2>
                <p className="mt-1 text-sm text-brand-muted">
                  {moduleCount} მოდული · {totalLessons} გაკვეთილი
                </p>

                <Accordion
                  type="multiple"
                  className="mt-6 space-y-4"
                  defaultValue={[course.modules[0]?.id ?? ""]}
                >
                  {course.modules.map((module, moduleIndex) => (
                    <AccordionItem
                      key={module.id}
                      value={module.id}
                      className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface"
                    >
                      <AccordionTrigger className="px-5 py-4 text-base font-semibold text-brand-secondary hover:no-underline">
                        <span className="flex items-center gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-primary-light text-xs font-bold text-brand-primary">
                            {moduleIndex + 1}
                          </span>
                          {module.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-4">
                        <ul className="space-y-2 pt-1">
                          {module.lessons.map((lesson) => {
                            const isAccessible = lesson.isFree || isEnrolled;
                            return (
                              <li
                                key={lesson.id}
                                className="flex items-center gap-3 rounded-lg border border-brand-border/60 bg-brand-background/30 px-3 py-3 text-sm transition-colors hover:bg-brand-primary-light/40"
                              >
                                {/* Lesson type icon */}
                                {lesson.type === "VIDEO" ? (
                                  <PlayCircle className="size-4 shrink-0 text-brand-primary" />
                                ) : (
                                  <FileText className="size-4 shrink-0 text-brand-primary" />
                                )}

                                {/* Title */}
                                <span className="flex-1 text-brand-secondary">
                                  {lesson.title}
                                </span>

                                {/* Duration */}
                                {lesson.duration > 0 && (
                                  <span className="text-xs text-brand-muted">
                                    {formatDuration(lesson.duration)}
                                  </span>
                                )}

                                {/* Lock/Unlock */}
                                {isAccessible ? (
                                  <Unlock className="size-3.5 text-brand-accent" />
                                ) : (
                                  <Lock className="size-3.5 text-brand-muted" />
                                )}

                                {/* Free badge */}
                                {lesson.isFree && !isEnrolled && (
                                  <Badge className="rounded-md bg-brand-accent/10 text-[10px] font-semibold text-brand-accent">
                                    უფასო
                                  </Badge>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>

          {/* Right sidebar: sticky info card */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
              {/* Thumbnail (mobile visible too) */}
              <div className="relative aspect-[16/9] overflow-hidden lg:hidden">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 340px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-brand-accent/10">
                    <BookOpen className="size-10 text-brand-primary" />
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <PriceTag price={course.price} size="lg" />
                </div>

                {/* CTA button */}
                <div className="mt-5">
                  {isEnrolled ? (
                    <Button
                      asChild
                      size="lg"
                      className="w-full rounded-xl bg-brand-accent text-base font-bold text-black transition-all duration-200 hover:scale-[1.01] hover:bg-brand-accent-hover"
                    >
                      <Link href={`/learn/${slug}`}>კურსის გაგრძელება</Link>
                    </Button>
                  ) : user ? (
                    course.price > 0 ? (
                      <BuyButton
                        courseId={course.id}
                        price={course.price}
                        className="w-full rounded-xl bg-brand-accent text-base font-bold text-black transition-all duration-200 hover:scale-[1.01] hover:bg-brand-accent-hover"
                      />
                    ) : (
                      <EnrollButton
                        courseId={course.id}
                        className="w-full rounded-xl bg-brand-accent text-base font-bold text-black transition-all duration-200 hover:scale-[1.01] hover:bg-brand-accent-hover"
                      />
                    )
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="w-full rounded-xl bg-brand-accent text-base font-bold text-black transition-all duration-200 hover:scale-[1.01] hover:bg-brand-accent-hover"
                    >
                      <Link href="/register">
                        {course.price > 0
                          ? `შეძენა ${course.price} ₾`
                          : "უფასო კურსის დაწყება"}
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <ul className="mt-6 space-y-3 border-t border-brand-border pt-6 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-brand-muted">
                      <Layers className="size-4" />
                      მოდულები
                    </span>
                    <span className="font-semibold text-brand-secondary">
                      {moduleCount}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-brand-muted">
                      <BookOpen className="size-4" />
                      გაკვეთილები
                    </span>
                    <span className="font-semibold text-brand-secondary">
                      {totalLessons}
                    </span>
                  </li>
                  {totalDuration > 0 && (
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-brand-muted">
                        <Clock className="size-4" />
                        ხანგრძლივობა
                      </span>
                      <span className="font-semibold text-brand-secondary">
                        {formatDuration(totalDuration)}
                      </span>
                    </li>
                  )}
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-brand-muted">
                      <MessageSquareText className="size-4" />
                      შეფასებები
                    </span>
                    <span className="font-semibold tabular-nums text-brand-secondary">
                      {reviewData.summary.totalReviews}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <ErrorBoundary
          actionHref="/courses"
          actionLabel="კურსებში დაბრუნება"
          className="min-h-[24rem] px-0 py-0 sm:px-0 sm:py-0"
        >
          <ReviewsSection
            key={[
              reviewData.summary.totalReviews,
              reviewData.summary.averageRating ?? "none",
              reviewData.currentUserReview?.id ?? "none",
              reviewData.currentUserReview?.updatedAt ?? "none",
              reviewData.reviews
                .map((review) => `${review.id}:${review.updatedAt}`)
                .join("|"),
            ].join("-")}
            courseId={course.id}
            summary={reviewData.summary}
            reviews={reviewData.reviews}
            currentUserReview={reviewData.currentUserReview}
            isAuthenticated={!!user}
            isEnrolled={isEnrolled}
          />
        </ErrorBoundary>
      </section>
    </div>
  );
}
