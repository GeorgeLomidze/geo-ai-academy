import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSignedEmbedUrl } from "@/lib/bunny/signed-url";
import { getLearningLessonData } from "@/lib/learn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonSidebar } from "@/components/learn/LessonSidebar";
import { TextLesson } from "@/components/learn/TextLesson";
import { TextLessonCompleteButton } from "@/components/learn/TextLessonCompleteButton";
import { VideoPlayer } from "@/components/learn/VideoPlayer";

type LearnLessonPageProps = {
  params: Promise<{ slug: string; lessonId: string }>;
};

export default async function LearnLessonPage({
  params,
}: LearnLessonPageProps) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { course, enrolled, lesson, prevLesson, nextLesson } = await getLearningLessonData(
    user.id,
    slug,
    lessonId
  );

  if (!course || !lesson) {
    notFound();
  }

  if (!enrolled) {
    redirect(`/courses/${slug}`);
  }

  let signedEmbedUrl: string | null = null;
  let videoError: string | null = null;

  if (lesson.type === "VIDEO") {
    if (lesson.bunnyVideoId) {
      try {
        signedEmbedUrl = getSignedEmbedUrl(lesson.bunnyVideoId);
      } catch {
        videoError = "ვიდეო ამ მომენტში მიუწვდომელია.";
      }
    } else {
      videoError = "ვიდეო ფაილი არ არის მიბმული.";
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        {lesson.type === "VIDEO" ? (
          signedEmbedUrl ? (
            <VideoPlayer
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              signedEmbedUrl={signedEmbedUrl}
              initialWatchedSeconds={lesson.watchedSeconds}
              initialCompleted={lesson.completed}
              prevLessonHref={prevLesson?.href ?? null}
              nextLessonHref={nextLesson?.href ?? null}
              fallbackHref={`/learn/${slug}`}
            />
          ) : (
            <div className="rounded-3xl border border-brand-border bg-brand-background px-6 py-16 text-center">
              <p className="text-sm text-brand-danger">{videoError}</p>
            </div>
          )
        ) : (
          <section className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{lesson.moduleTitle}</Badge>
              <Badge variant="outline">ტექსტური გაკვეთილი</Badge>
              {lesson.completed ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-success/10 px-3 py-1 text-sm font-medium text-brand-success">
                  <CheckCircle2 className="size-4" />
                  დასრულებულია
                </div>
              ) : null}
            </div>

            <TextLesson content={lesson.content ?? "ტექსტური შინაარსი ჯერ არ არის დამატებული."} />

            <div className="mt-6 rounded-3xl border border-brand-border bg-brand-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-muted">მიმდინარე გაკვეთილი</p>
                  <p className="mt-2 text-balance text-lg font-semibold text-brand-secondary">
                    {lesson.title}
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">{lesson.moduleTitle}</p>
                </div>

                <TextLessonCompleteButton
                  lessonId={lesson.id}
                  initialCompleted={lesson.completed}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {nextLesson ? (
                  <Button
                    asChild
                    className="rounded-xl bg-brand-primary text-black hover:bg-brand-primary-hover"
                  >
                    <Link href={nextLesson.href}>
                      შემდეგი გაკვეთილი
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href={`/learn/${slug}`}>კურსის მიმოხილვა</Link>
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="space-y-5 xl:sticky xl:top-24">
        <LessonSidebar
          courseTitle={course.title}
          courseSlug={course.slug}
          modules={course.modules}
          progressPercentage={course.progressPercentage}
          currentLessonId={lesson.id}
          backHref={`/learn/${slug}`}
        />
      </div>
    </div>
  );
}
