import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BookOpen, CheckCircle2, FileText, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLearningCourse } from "@/lib/learn";
import { formatLessonDuration } from "@/lib/learn-shared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/learn/ProgressBar";

type LearnOverviewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LearnOverviewPage({
  params,
}: LearnOverviewPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { course, enrolled } = await getLearningCourse(user.id, slug);

  if (!course) {
    notFound();
  }

  if (!enrolled) {
    redirect(`/courses/${slug}`);
  }

  const defaultOpenModule = course.resumeLesson
    ? course.modules.find((module) =>
        module.lessons.some((lesson) => lesson.id === course.resumeLesson?.id)
      )?.id
    : course.modules[0]?.id;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm sm:p-8">
        {course.thumbnailUrl ? (
          <>
            <div className="absolute inset-0">
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                sizes="100vw"
                className="object-cover object-top"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.38)_0%,rgba(5,5,5,0.74)_38%,rgba(5,5,5,0.92)_70%,rgba(5,5,5,0.98)_100%)]" />
          </>
        ) : null}

        <div className="relative flex flex-wrap items-center gap-3">
          <Badge variant="outline">ჩარიცხული კურსი</Badge>
          <Badge variant="outline" className="tabular-nums">
            {course.totalLessons} გაკვეთილი
          </Badge>
        </div>

        <h1 className="relative mt-4 max-w-3xl text-balance font-display text-3xl font-bold text-brand-secondary sm:text-4xl">
          {course.title}
        </h1>

        <p className="relative mt-3 max-w-3xl text-pretty text-base leading-7 text-brand-secondary/78">
          {course.shortDescription ?? course.description ?? "კურსის სასწავლო მასალა და პროგრესი."}
        </p>

        <div className="relative mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-5">
            <ProgressBar value={course.progressPercentage} label="საერთო პროგრესი" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-brand-background p-4">
                <p className="text-sm text-brand-muted">დასრულებული</p>
                <p className="mt-2 tabular-nums text-2xl font-semibold text-brand-secondary">
                  {course.completedLessons}
                </p>
              </div>
              <div className="rounded-2xl bg-brand-background p-4">
                <p className="text-sm text-brand-muted">დარჩენილი</p>
                <p className="mt-2 tabular-nums text-2xl font-semibold text-brand-secondary">
                  {Math.max(course.totalLessons - course.completedLessons, 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-brand-background p-4">
                <p className="text-sm text-brand-muted">პროგრესი</p>
                <p className="mt-2 tabular-nums text-2xl font-semibold text-brand-secondary">
                  {course.progressPercentage}%
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-brand-border bg-brand-background p-5">
            <div>
              <p className="text-sm font-medium text-brand-muted">შემდეგი ნაბიჯი</p>
              <p className="mt-2 text-pretty text-base font-semibold text-brand-secondary">
                {course.resumeLesson
                  ? course.resumeLesson.title
                  : "კურსში გაკვეთილები ჯერ არ არის დამატებული"}
              </p>
              {course.resumeLesson ? (
                <p className="mt-2 text-sm text-brand-muted">
                  {course.resumeLesson.type === "VIDEO" ? "ვიდეო" : "ტექსტი"} ·{" "}
                  {formatLessonDuration(course.resumeLesson.duration)}
                </p>
              ) : null}
            </div>

            {course.resumeLesson ? (
              <Button
                asChild
                className="mt-6 rounded-xl bg-brand-primary text-black hover:bg-brand-primary-hover"
              >
                <Link href={course.resumeLesson.href}>გაგრძელება</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="mt-6 rounded-xl">
                <Link href="/my-courses">ჩემი კურსები</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <BookOpen className="size-5 text-brand-primary" />
          <div>
            <h2 className="text-balance font-display text-2xl font-bold text-brand-secondary">
              კურსის პროგრამა
            </h2>
            <p className="text-sm text-brand-muted">
              აირჩიე გაკვეთილი და გააგრძელე სწავლა
            </p>
          </div>
        </div>

        {course.modules.length > 0 ? (
          <Accordion
            type="multiple"
            defaultValue={defaultOpenModule ? [defaultOpenModule] : []}
            className="mt-6 space-y-3"
          >
            {course.modules.map((module) => (
              <AccordionItem
                key={module.id}
                value={module.id}
                className="overflow-hidden rounded-2xl border border-brand-border bg-brand-background"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="truncate text-left text-base font-semibold text-brand-secondary">
                        {module.title}
                      </span>
                      <Badge variant="outline" className="tabular-nums">
                        {module.progressPercentage}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-left text-sm text-brand-muted">
                      <span className="tabular-nums">{module.completedLessons}</span> /{" "}
                      <span className="tabular-nums">{module.totalLessons}</span> გაკვეთილი დასრულებულია
                    </p>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="space-y-3 px-4 pb-4">
                  {module.lessons.map((lesson) => {
                    const Icon = lesson.type === "VIDEO" ? PlayCircle : FileText;

                    return (
                      <Link
                        key={lesson.id}
                        href={lesson.href}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-brand-border bg-brand-surface px-4 py-4 transition-colors hover:border-brand-primary/30 hover:bg-brand-surface-light"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 shrink-0 text-brand-primary" />
                            <p className="truncate text-sm font-semibold text-brand-secondary">
                              {lesson.title}
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-brand-muted">
                            {lesson.type === "VIDEO" ? "ვიდეო გაკვეთილი" : "ტექსტური გაკვეთილი"} ·{" "}
                            {formatLessonDuration(lesson.duration)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {lesson.completed ? (
                            <CheckCircle2 className="size-4 text-brand-success" />
                          ) : null}
                          <Badge variant="outline">
                            {lesson.completed ? "დასრულებულია" : "გასავლელი"}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-brand-border px-6 py-12 text-center">
            <p className="text-pretty text-sm text-brand-muted">
              კურსში გაკვეთილები ჯერ არ არის დამატებული.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
