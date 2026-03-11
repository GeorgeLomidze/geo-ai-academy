export const dynamic = "force-dynamic";

import Link from "next/link";
import { Filter, MessageSquareText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AdminQATable, type AdminQAQuestionRecord } from "@/components/admin/AdminQATable";

interface AdminQAPageProps {
  searchParams: Promise<{
    courseId?: string;
    questionId?: string;
  }>;
}

async function getAdminQAData(courseId?: string) {
  const where = courseId ? { lesson: { module: { courseId } } } : undefined;

  const [questions, courses] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        adminReadAt: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                course: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        answers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            imageUrl: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  const serializedQuestions: AdminQAQuestionRecord[] = questions.map((question) => ({
    id: question.id,
    content: question.content,
    imageUrl: question.imageUrl,
    createdAt: question.createdAt.toISOString(),
    isUnread: question.adminReadAt === null,
    student: {
      name: question.user.name,
      avatarUrl: question.user.avatarUrl,
      email: question.user.email,
    },
    course: {
      id: question.lesson.module.course.id,
      slug: question.lesson.module.course.slug,
      title: question.lesson.module.course.title,
    },
    lesson: {
      id: question.lesson.id,
      title: question.lesson.title,
    },
    answersCount: question.answers.length,
    answers: question.answers.map((answer) => ({
      id: answer.id,
      content: answer.content,
      imageUrl: answer.imageUrl,
      createdAt: answer.createdAt.toISOString(),
      user: {
        name: answer.user.name,
        avatarUrl: answer.user.avatarUrl,
        email: answer.user.email,
      },
    })),
  }));

  return {
    questions: serializedQuestions,
    courses,
  };
}

export default async function AdminQAPage({ searchParams }: AdminQAPageProps) {
  const params = await searchParams;
  const courseId = params.courseId?.trim() || "";
  const questionId = params.questionId?.trim() || "";
  const { questions, courses } = await getAdminQAData(courseId || undefined);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-secondary">
            კითხვა-პასუხი
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            ყველა კურსისა და გაკვეთილის კითხვების ნახვა, გაფილტვრა და მოდერაცია
          </p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-muted">
          სულ {questions.length} კითხვა
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        <form className="grid gap-3 border-b border-brand-border p-4 sm:grid-cols-[1fr_auto_auto]">
          <label className="flex items-center">
            <span className="sr-only">კურსის ფილტრი</span>
            <select
              name="courseId"
              defaultValue={courseId}
              className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm text-brand-secondary outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="კურსის ფილტრი"
            >
              <option value="">ყველა კურსი</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <Button type="submit" className="h-11 rounded-xl">
            <Filter className="size-4" />
            გაფილტვრა
          </Button>

          {courseId ? (
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/admin/qa">გასუფთავება</Link>
            </Button>
          ) : (
            <div />
          )}
        </form>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary-light">
              <MessageSquareText className="size-6 text-brand-primary" />
            </div>
            <h2 className="mt-4 text-balance font-display text-xl font-bold text-brand-secondary">
              კითხვები ვერ მოიძებნა
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-brand-muted">
              ამ ფილტრით ჯერ კითხვა არ არის. სცადე სხვა კურსი ან გაასუფთავე
              ფილტრი.
            </p>
            {courseId ? (
              <Button asChild className="mt-5 rounded-xl">
                <Link href="/admin/qa">ფილტრების გასუფთავება</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <AdminQATable
            questions={questions}
            initialExpandedQuestionId={questionId || null}
          />
        )}
      </div>
    </div>
  );
}
