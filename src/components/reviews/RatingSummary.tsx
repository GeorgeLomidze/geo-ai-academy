"use client";

import { MessageSquareText } from "lucide-react";
import { formatRatingValue } from "@/lib/review-constants";
import type { CourseRatingSummary } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/reviews/StarRating";

interface RatingSummaryProps {
  summary: CourseRatingSummary;
  className?: string;
}

export function RatingSummary({ summary, className }: RatingSummaryProps) {
  if (summary.totalReviews === 0) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-dashed border-brand-border bg-brand-surface p-6",
          className
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary-light">
          <MessageSquareText className="size-5 text-brand-primary" />
        </div>
        <h3 className="mt-4 text-balance font-display text-xl font-bold text-brand-secondary">
          შეფასებები ჯერ არ არის
        </h3>
        <p className="mt-2 text-pretty text-sm leading-6 text-brand-muted">
          როგორც კი პირველი სტუდენტი დატოვებს შეფასებას, საშუალო ქულა აქ
          გამოჩნდება.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm",
        className
      )}
    >
      <div>
        <p className="text-sm font-medium text-brand-muted">საშუალო შეფასება</p>
        <p className="mt-3 font-display text-4xl font-bold tabular-nums text-brand-secondary">
          {summary.averageRating ? formatRatingValue(summary.averageRating) : "0"}
        </p>
        <div className="mt-3">
          <StarRating value={summary.averageRating ?? 0} size="md" />
        </div>
        <p className="mt-3 text-sm text-brand-muted">
          სულ {summary.totalReviews} შეფასება
        </p>
      </div>
    </div>
  );
}
