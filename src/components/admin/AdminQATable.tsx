"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, MessageSquareText } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { DeleteQAItemButton } from "@/components/qa/DeleteQAItemButton";
import { QAImagePreview } from "@/components/qa/QAImagePreview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminQAAnswerRecord = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
    email: string;
  };
};

export type AdminQAQuestionRecord = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  isUnread: boolean;
  student: {
    name: string | null;
    avatarUrl: string | null;
    email: string;
  };
  course: {
    id: string;
    slug: string;
    title: string;
  };
  lesson: {
    id: string;
    title: string;
  };
  answersCount: number;
  answers: AdminQAAnswerRecord[];
};

interface AdminQATableProps {
  questions: AdminQAQuestionRecord[];
  initialExpandedQuestionId?: string | null;
}

function getInitials(name: string | null) {
  if (!name) {
    return "სტ";
  }

  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminQATable({
  questions,
  initialExpandedQuestionId = null,
}: AdminQATableProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    initialExpandedQuestionId
  );
  const [unreadQuestionIds, setUnreadQuestionIds] = useState(
    Object.fromEntries(
      questions
        .filter((question) => question.isUnread)
        .map((question) => [question.id, true])
    ) as Record<string, boolean>
  );

  async function markQuestionAsRead(questionId: string) {
    if (!unreadQuestionIds[questionId]) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        return;
      }

      setUnreadQuestionIds((current) => {
        const next = { ...current };
        delete next[questionId];
        return next;
      });
      window.dispatchEvent(new Event("qa:notifications-sync"));
    } catch {
      // Keep the unread badge if the request fails.
    }
  }

  useEffect(() => {
    if (!initialExpandedQuestionId) {
      return;
    }

    if (!unreadQuestionIds[initialExpandedQuestionId]) {
      return;
    }

    void fetch(`/api/questions/${initialExpandedQuestionId}`, {
      method: "PATCH",
    })
      .then((response) => {
        if (!response.ok) {
          return null;
        }

        setUnreadQuestionIds((current) => {
          const next = { ...current };
          delete next[initialExpandedQuestionId];
          return next;
        });
        window.dispatchEvent(new Event("qa:notifications-sync"));

        return response;
      })
      .catch(() => {
        // Ignore initial read sync failures and keep the unread badge.
      });
  }, [initialExpandedQuestionId, unreadQuestionIds]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary-light">
          <MessageSquareText className="size-6 text-brand-primary" />
        </div>
        <h2 className="mt-4 text-balance font-display text-xl font-bold text-brand-secondary">
          კითხვები ვერ მოიძებნა
        </h2>
        <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-brand-muted">
          შეცვალე კურსის ფილტრი ან დაელოდე, სანამ სტუდენტები ახალ კითხვებს
          დასვამენ.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-brand-border">
          <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
            სტუდენტი
          </TableHead>
          <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
            კურსი
          </TableHead>
          <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
            გაკვეთილი
          </TableHead>
          <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
            კითხვა
          </TableHead>
          <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
            პასუხები
          </TableHead>
          <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
            თარიღი
          </TableHead>
          <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
            მოქმედებები
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {questions.map((question) => {
          const expanded = expandedQuestionId === question.id;
          const isUnread = Boolean(unreadQuestionIds[question.id]);
          const lessonQAHref = `/learn/${question.course.slug}/${question.lesson.id}#qa-section`;

          return (
            <Fragment key={question.id}>
              <TableRow key={question.id} className="border-brand-border align-top">
                <TableCell className="px-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={question.student.avatarUrl ?? undefined}
                        alt={question.student.name ?? "სტუდენტი"}
                      />
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                        {getInitials(question.student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-brand-secondary">
                        {question.student.name ?? "უსახელო სტუდენტი"}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {question.student.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 text-sm text-brand-secondary">
                  {question.course.title}
                </TableCell>
                <TableCell className="px-4 text-sm text-brand-secondary">
                  {question.lesson.title}
                </TableCell>
                <TableCell className="px-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isUnread
                            ? "rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "rounded-full text-brand-muted"
                        }
                      >
                        {isUnread ? "წაუკითხავი" : "წაკითხული"}
                      </Badge>
                      <p className="line-clamp-2 max-w-md text-pretty text-sm leading-6 text-brand-secondary/90">
                        {question.content}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <Badge
                    variant="outline"
                    className="rounded-full tabular-nums"
                  >
                    {question.answersCount}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 text-sm tabular-nums text-brand-muted">
                  {formatRelativeTime(question.createdAt)}
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setExpandedQuestionId((current) =>
                          current === question.id ? null : question.id
                        );

                        if (!expanded) {
                          void markQuestionAsRead(question.id);
                        }
                      }}
                    >
                      {expanded ? (
                        <>
                          დამალვა
                          <ChevronUp className="size-4" />
                        </>
                      ) : (
                        <>
                          ნახვა
                          <ChevronDown className="size-4" />
                        </>
                      )}
                    </Button>
                    <DeleteQAItemButton
                      endpoint={`/api/questions/${question.id}`}
                      dialogTitle="კითხვის წაშლა"
                      dialogDescription="ეს კითხვა და მასთან დაკავშირებული პასუხები წაიშლება."
                      iconOnly
                      label="კითხვის წაშლა"
                    />
                  </div>
                </TableCell>
              </TableRow>

              {expanded ? (
                <TableRow className="border-brand-border bg-brand-background/40">
                  <TableCell colSpan={7} className="px-4 py-5">
                    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-medium uppercase text-brand-muted">
                            სრული კითხვა
                          </p>
                          <Button asChild variant="outline" className="rounded-xl">
                            <Link href={lessonQAHref}>
                              ვიდეოს Q&A-ზე გადასვლა
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-pretty text-sm leading-7 text-brand-secondary">
                          {question.content}
                        </p>
                        {question.imageUrl ? (
                          <div className="mt-4">
                            <QAImagePreview
                              src={question.imageUrl}
                              alt="კითხვის მიმაგრებული სურათი"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-brand-secondary">
                            პასუხები
                          </p>
                          <Badge variant="outline" className="rounded-full tabular-nums">
                            {question.answersCount}
                          </Badge>
                        </div>

                        {question.answers.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-brand-border px-4 py-6 text-sm text-brand-muted">
                            ამ კითხვას ჯერ პასუხი არ აქვს.
                          </div>
                        ) : (
                          question.answers.map((answer) => (
                            <div
                              key={answer.id}
                              className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-brand-background/70 p-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <Avatar>
                                  <AvatarImage
                                    src={answer.user.avatarUrl ?? undefined}
                                    alt={answer.user.name ?? "სტუდენტი"}
                                  />
                                  <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                                    {getInitials(answer.user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-brand-secondary">
                                      {answer.user.name ?? "უსახელო სტუდენტი"}
                                    </p>
                                    <span className="text-xs text-brand-muted">
                                      {formatRelativeTime(answer.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-brand-muted">
                                    {answer.user.email}
                                  </p>
                                  <p className="mt-3 whitespace-pre-wrap text-pretty text-sm leading-7 text-brand-secondary/90">
                                    {answer.content}
                                  </p>
                                  {answer.imageUrl ? (
                                    <div className="mt-4">
                                      <QAImagePreview
                                        src={answer.imageUrl}
                                        alt="პასუხის მიმაგრებული სურათი"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <DeleteQAItemButton
                                endpoint={`/api/answers/${answer.id}`}
                                dialogTitle="პასუხის წაშლა"
                                dialogDescription="ეს პასუხი წაიშლება და ვეღარ აღდგება."
                                iconOnly
                                label="პასუხის წაშლა"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
