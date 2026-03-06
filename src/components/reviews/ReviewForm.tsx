"use client";

import { startTransition, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PencilLine } from "lucide-react";
import type { CourseRatingSummary, SerializedReview } from "@/lib/reviews";
import { type ReviewRatingValue } from "@/lib/review-constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/reviews/StarRating";

interface ReviewFormProps {
  courseId: string;
  initialReview: SerializedReview | null;
  onSaved?: (payload: {
    review: SerializedReview;
    summary: CourseRatingSummary;
  }) => void;
}

type ReviewFormErrors = {
  courseId?: string;
  rating?: string;
  comment?: string;
};

type ReviewResponse = {
  success: true;
  action: "created" | "updated";
  message: string;
  review: SerializedReview;
  summary: CourseRatingSummary;
};

export function ReviewForm({
  courseId,
  initialReview,
  onSaved,
}: ReviewFormProps) {
  const router = useRouter();
  const textareaId = useId();
  const [rating, setRating] = useState<number>(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setRating(initialReview?.rating ?? 0);
    setComment(initialReview?.comment ?? "");
    setErrors({});
    setError(null);
  }, [initialReview]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          rating,
          comment,
        }),
      });

      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson
        ? ((await response.json()) as
            | ReviewResponse
            | {
                error?: string;
                fieldErrors?: ReviewFormErrors;
              })
        : null;

      if (!response.ok) {
        setErrors(data && "fieldErrors" in data ? data.fieldErrors ?? {} : {});
        setError(
          data && "error" in data
            ? data.error ?? "შეფასების შენახვა ვერ მოხერხდა"
            : "შეფასების შენახვა ვერ მოხერხდა"
        );
        return;
      }

      if (!data || !("review" in data)) {
        setError("სერვერის პასუხი არასწორია");
        return;
      }

      setRating(data.review.rating);
      setComment(data.review.comment);
      setSuccessMessage(data.message);
      onSaved?.({
        review: data.review,
        summary: data.summary,
      });

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-balance font-display text-xl font-bold text-brand-secondary">
            {initialReview ? "შენი შეფასების რედაქტირება" : "დატოვე შეფასება"}
          </h3>
          <p className="mt-2 text-pretty text-sm leading-6 text-brand-muted">
            გაუზიარე სხვა სტუდენტებს შენი გამოცდილება. შეფასება შეიძლება
            განაახლო ნებისმიერ დროს.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-brand-primary-light p-3 sm:flex">
          <PencilLine className="size-5 text-brand-primary" />
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-2xl border border-brand-success/20 bg-brand-success/10 px-4 py-3 text-sm text-brand-success"
          >
            <CheckCircle2 className="size-4" />
            {successMessage}
          </div>
        )}

        <div>
          <StarRating
            value={rating}
            readOnly={false}
            onChange={(nextRating: ReviewRatingValue) => {
              setRating(nextRating);
              setErrors((current) => ({ ...current, rating: undefined }));
            }}
            size="lg"
            label="ვარსკვლავური შეფასება"
            error={!!errors.rating}
          />
          <p className="mt-2 text-xs text-brand-muted">
            შესაძლებელია ნახევარი ვარსკვლავიც აირჩიო.
          </p>
          {errors.rating && (
            <p role="alert" className="mt-2 text-xs text-brand-danger">
              {errors.rating}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={textareaId}>კომენტარი</Label>
            <span className="text-xs tabular-nums text-brand-muted">
              {comment.length}/1000
            </span>
          </div>
          <Textarea
            id={textareaId}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setErrors((current) => ({ ...current, comment: undefined }));
            }}
            placeholder="რას მოიცავდა კურსი, რა მოგეწონა და რას ურჩევდი სხვა სტუდენტებს?"
            className="min-h-32 rounded-2xl"
            aria-invalid={!!errors.comment}
            aria-describedby={
              errors.comment ? `${textareaId}-error ${textareaId}-hint` : `${textareaId}-hint`
            }
          />
          <p id={`${textareaId}-hint`} className="text-xs text-brand-muted">
            მაქსიმუმ 1000 სიმბოლო.
          </p>
          {errors.comment && (
            <p id={`${textareaId}-error`} role="alert" className="text-xs text-brand-danger">
              {errors.comment}
            </p>
          )}
        </div>

        <Button type="submit" className="rounded-xl" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {initialReview ? "შეფასების განახლება" : "შეფასების დამატება"}
        </Button>
      </form>
    </div>
  );
}
