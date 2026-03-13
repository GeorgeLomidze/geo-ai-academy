"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, Loader2, MessageSquareText, PencilLine, Reply, SendHorizonal } from "lucide-react";
import type { SerializedQuestion } from "@/lib/qa";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DeleteQAItemButton } from "@/components/qa/DeleteQAItemButton";
import { QAImageGallery } from "@/components/qa/QAImageGallery";
import { QAImageUploader } from "@/components/qa/QAImageUploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QASectionProps {
  lessonId: string;
}

type QuestionsResponse = {
  questions: SerializedQuestion[];
  questionCount: number;
  currentUser: {
    id: string;
    isAdmin: boolean;
  };
  error?: string;
};

type MutationErrorResponse = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function fetchQuestionsForLesson(lessonId: string) {
  const response = await fetch(
    `/api/questions?lessonId=${encodeURIComponent(lessonId)}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = (await response.json()) as QuestionsResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "კითხვა-პასუხის ჩატვირთვა ვერ მოხერხდა");
  }

  return data;
}

async function getAuthHeaders() {
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
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

function QuestionItem({
  question,
  onChanged,
}: {
  question: SerializedQuestion;
  onChanged: () => Promise<void>;
}) {
  const answerId = useId();
  const editId = useId();
  const [answerOpen, setAnswerOpen] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [answerPending, setAnswerPending] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [questionContent, setQuestionContent] = useState(question.content);
  const [questionImageUrls, setQuestionImageUrls] = useState(question.imageUrls);
  const [questionPending, setQuestionPending] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editingAnswerContent, setEditingAnswerContent] = useState("");
  const [answerImageUrls, setAnswerImageUrls] = useState<string[]>([]);
  const [editingAnswerImageUrls, setEditingAnswerImageUrls] = useState<string[]>([]);
  const [editingAnswerPending, setEditingAnswerPending] = useState(false);
  const [editingAnswerError, setEditingAnswerError] = useState<string | null>(null);

  useEffect(() => {
    setQuestionContent(question.content);
    setQuestionImageUrls(question.imageUrls);
  }, [question.content, question.imageUrls]);

  async function handleAnswerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnswerPending(true);
    setAnswerError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/answers", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          questionId: question.id,
          content: answerContent,
          imageUrls: answerImageUrls,
        }),
      });

      const data = (await response.json()) as MutationErrorResponse;

      if (!response.ok) {
        setAnswerError(data.error ?? "პასუხის დამატება ვერ მოხერხდა");
        return;
      }

      setAnswerContent("");
      setAnswerImageUrls([]);
      setAnswerOpen(false);
      await onChanged();
    } catch {
      setAnswerError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setAnswerPending(false);
    }
  }

  async function handleQuestionUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuestionPending(true);
    setQuestionError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/questions/${question.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          content: questionContent,
          imageUrls: questionImageUrls,
        }),
      });

      const data = (await response.json()) as MutationErrorResponse;

      if (!response.ok) {
        setQuestionError(data.error ?? "კითხვის განახლება ვერ მოხერხდა");
        return;
      }

      setEditingQuestion(false);
      await onChanged();
    } catch {
      setQuestionError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setQuestionPending(false);
    }
  }

  async function handleAnswerUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingAnswerId) {
      return;
    }

    setEditingAnswerPending(true);
    setEditingAnswerError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/answers/${editingAnswerId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          content: editingAnswerContent,
          imageUrls: editingAnswerImageUrls,
        }),
      });

      const data = (await response.json()) as MutationErrorResponse;

      if (!response.ok) {
        setEditingAnswerError(data.error ?? "პასუხის განახლება ვერ მოხერხდა");
        return;
      }

      setEditingAnswerId(null);
      setEditingAnswerContent("");
      await onChanged();
    } catch {
      setEditingAnswerError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setEditingAnswerPending(false);
    }
  }

  return (
    <article className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar data-size="lg">
            <AvatarImage
              src={question.user.avatarUrl ?? undefined}
              alt={question.user.name ?? "სტუდენტი"}
            />
            <AvatarFallback className="bg-brand-primary-light text-brand-primary">
              {getInitials(question.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-secondary">
              {question.user.name ?? "უსახელო სტუდენტი"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
              <span>{formatRelativeTime(question.createdAt)}</span>
              {question.updatedAt !== question.createdAt ? <span>რედაქტირებულია</span> : null}
              <Badge variant="outline" className="rounded-full">
                {question.answersCount} პასუხი
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {question.permissions.canEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl"
              aria-label="კითხვის ჩასწორება"
              onClick={() => {
                setEditingQuestion((current) => !current);
                setQuestionError(null);
              }}
            >
              <PencilLine className="size-4" />
            </Button>
          ) : null}

          {question.permissions.canDelete ? (
            <DeleteQAItemButton
              endpoint={`/api/questions/${question.id}`}
              dialogTitle="კითხვის წაშლა"
              dialogDescription="კითხვა და მასთან დაკავშირებული პასუხები წაიშლება სამუდამოდ."
              iconOnly
              label="კითხვის წაშლა"
              refreshAfterDelete={false}
              onDeleted={onChanged}
            />
          ) : null}
        </div>
      </div>

      {editingQuestion ? (
        <form className="mt-4 space-y-3" onSubmit={handleQuestionUpdate}>
          <Textarea
            id={editId}
            value={questionContent}
            onChange={(event) => setQuestionContent(event.target.value)}
            className="min-h-28 rounded-2xl"
            aria-label="კითხვის რედაქტირება"
          />
          <QAImageUploader
            value={questionImageUrls}
            onChange={setQuestionImageUrls}
          />
          {questionError ? (
            <p role="alert" className="text-sm text-brand-danger">
              {questionError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="rounded-xl" disabled={questionPending}>
              {questionPending ? <Loader2 className="size-4 animate-spin" /> : null}
              შენახვა
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setEditingQuestion(false);
                setQuestionContent(question.content);
                setQuestionImageUrls(question.imageUrls);
                setQuestionError(null);
              }}
            >
              გაუქმება
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="whitespace-pre-wrap text-pretty text-sm leading-7 text-brand-secondary/90">
            {question.content}
          </p>
          <QAImageGallery
            images={question.imageUrls}
            altPrefix="კითხვის მიმაგრებული სურათი"
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-brand-border pt-4">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setAnswerOpen((current) => !current);
            setAnswerError(null);
          }}
        >
          <Reply className="size-4" />
          პასუხის გაცემა
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              answerOpen ? "rotate-180" : ""
            )}
          />
        </Button>
      </div>

      {answerOpen ? (
        <form className="mt-4 space-y-3" onSubmit={handleAnswerSubmit}>
          <Textarea
            id={answerId}
            value={answerContent}
            onChange={(event) => setAnswerContent(event.target.value)}
            placeholder="დაწერე შენი პასუხი"
            className="min-h-24 rounded-2xl"
            aria-label="პასუხის ტექსტი"
          />
          <QAImageUploader
            value={answerImageUrls}
            onChange={setAnswerImageUrls}
          />
          {answerError ? (
            <p role="alert" className="text-sm text-brand-danger">
              {answerError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="rounded-xl" disabled={answerPending}>
              {answerPending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
              პასუხის დამატება
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setAnswerOpen(false);
                setAnswerContent("");
                setAnswerImageUrls([]);
                setAnswerError(null);
              }}
            >
              გაუქმება
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {question.answers.map((answer) => {
          const isEditing = editingAnswerId === answer.id;

          return (
            <div
              key={answer.id}
              className="rounded-2xl border border-brand-border bg-brand-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
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
                    <p className="truncate text-sm font-medium text-brand-secondary">
                      {answer.user.name ?? "უსახელო სტუდენტი"}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {formatRelativeTime(answer.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {answer.permissions.canEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-xl"
                      aria-label="პასუხის ჩასწორება"
                      onClick={() => {
                        setEditingAnswerId(answer.id);
                        setEditingAnswerContent(answer.content);
                        setEditingAnswerImageUrls(answer.imageUrls);
                        setEditingAnswerError(null);
                      }}
                    >
                      <PencilLine className="size-4" />
                    </Button>
                  ) : null}

                  {answer.permissions.canDelete ? (
                    <DeleteQAItemButton
                      endpoint={`/api/answers/${answer.id}`}
                      dialogTitle="პასუხის წაშლა"
                      dialogDescription="ეს პასუხი სამუდამოდ წაიშლება."
                      iconOnly
                      label="პასუხის წაშლა"
                      refreshAfterDelete={false}
                      onDeleted={onChanged}
                    />
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <form className="mt-3 space-y-3" onSubmit={handleAnswerUpdate}>
                  <Textarea
                    value={editingAnswerContent}
                    onChange={(event) => setEditingAnswerContent(event.target.value)}
                    className="min-h-24 rounded-2xl"
                    aria-label="პასუხის რედაქტირება"
                  />
                  <QAImageUploader
                    value={editingAnswerImageUrls}
                    onChange={setEditingAnswerImageUrls}
                  />
                  {editingAnswerError ? (
                    <p role="alert" className="text-sm text-brand-danger">
                      {editingAnswerError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" className="rounded-xl" disabled={editingAnswerPending}>
                      {editingAnswerPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      შენახვა
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setEditingAnswerId(null);
                        setEditingAnswerContent("");
                        setEditingAnswerImageUrls([]);
                        setEditingAnswerError(null);
                      }}
                    >
                      გაუქმება
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 space-y-4">
                  <p className="whitespace-pre-wrap text-pretty text-sm leading-7 text-brand-secondary/90">
                    {answer.content}
                  </p>
                  <QAImageGallery
                    images={answer.imageUrls}
                    altPrefix="პასუხის მიმაგრებული სურათი"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function QASection({ lessonId }: QASectionProps) {
  const textareaId = useId();
  const [questions, setQuestions] = useState<SerializedQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function loadQuestions() {
    setLoading(true);

    try {
      const data = await fetchQuestionsForLesson(lessonId);
      setQuestions(data.questions);
      setQuestionCount(data.questionCount);
      setError(null);
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function hydrateQuestions() {
      setLoading(true);

      try {
        const data = await fetchQuestionsForLesson(lessonId);

        if (!active) {
          return;
        }

        setQuestions(data.questions);
        setQuestionCount(data.questionCount);
        setError(null);
      } catch {
        if (active) {
          setError("კავშირის შეცდომა, სცადეთ თავიდან");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void hydrateQuestions();

    return () => {
      active = false;
    };
  }, [lessonId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/questions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          lessonId,
          content,
          imageUrls,
        }),
      });

      const data = (await response.json()) as MutationErrorResponse;

      if (!response.ok) {
        setSubmitError(data.error ?? "კითხვის დამატება ვერ მოხერხდა");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      setContent("");
      setImageUrls([]);
      await loadQuestions();
    } catch {
      setSubmitError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-brand-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-primary-light">
              <MessageSquareText className="size-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-brand-secondary">
                კითხვა-პასუხი
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                დასვი კითხვა ამ გაკვეთილზე და მიიღე პასუხები სხვა სტუდენტებისგან.
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="h-10 rounded-full px-4 text-sm tabular-nums">
          {questionCount} კითხვა
        </Badge>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor={textareaId} className="text-sm font-medium text-brand-secondary">
            დასვი კითხვა
          </label>
          <Textarea
            id={textareaId}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setFieldErrors((current) => {
                if (!current.content) {
                  return current;
                }

                const next = { ...current };
                delete next.content;
                return next;
              });
            }}
            placeholder="რას ვერ მიხვდი ამ გაკვეთილში? დაწერე დეტალურად."
            className="min-h-28 rounded-2xl"
            aria-invalid={!!fieldErrors.content}
          />
          <QAImageUploader
            value={imageUrls}
            onChange={(nextValue) => {
              setImageUrls(nextValue);
              setFieldErrors((current) => {
                if (!current.imageUrls && !current.imageUrl) {
                  return current;
                }

                const next = { ...current };
                delete next.imageUrls;
                delete next.imageUrl;
                return next;
              });
            }}
            error={fieldErrors.imageUrls ?? fieldErrors.imageUrl}
          />
          {fieldErrors.content ? (
            <p role="alert" className="text-sm text-brand-danger">
              {fieldErrors.content}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <div
            role="alert"
            className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger"
          >
            {submitError}
          </div>
        ) : null}

        <Button type="submit" className="rounded-xl" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          კითხვის დასმა
        </Button>
      </form>

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-background/60 px-4 py-5 text-sm text-brand-muted">
            <Loader2 className="size-4 animate-spin" />
            კითხვა-პასუხი იტვირთება...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-5 text-sm text-brand-danger">
            {error}
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-brand-border bg-brand-background/50 px-6 py-12 text-center">
            <h3 className="font-display text-xl font-bold text-brand-secondary">
              ჯერ კითხვები არ არის
            </h3>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              იყავი პირველი, ვინც ამ გაკვეთილზე კითხვას დასვამს.
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              onChanged={loadQuestions}
            />
          ))
        )}
      </div>
    </section>
  );
}
