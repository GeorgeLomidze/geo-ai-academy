"use client";

import { Edit3 } from "lucide-react";
import type { CourseRatingSummary, SerializedReview } from "@/lib/reviews";
import { DeleteReviewButton } from "@/components/reviews/DeleteReviewButton";
import { StarRating } from "@/components/reviews/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReviewCardProps {
  review: SerializedReview;
  onEdit?: (review: SerializedReview) => void;
  onDeleted?: (payload: {
    reviewId: string;
    summary?: CourseRatingSummary;
  }) => void;
}

const reviewDateFormatter = new Intl.DateTimeFormat("ka-GE", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

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

export function ReviewCard({ review, onEdit, onDeleted }: ReviewCardProps) {
  const createdLabel = reviewDateFormatter.format(new Date(review.createdAt));
  const wasUpdated = review.updatedAt !== review.createdAt;

  return (
    <article className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage
              src={review.user.avatarUrl ?? undefined}
              alt={review.user.name ?? "სტუდენტი"}
            />
            <AvatarFallback className="bg-brand-primary-light font-medium text-brand-primary">
              {getInitials(review.user.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-brand-secondary">
                {review.user.name ?? "სტუდენტი"}
              </p>
              {review.isOwnReview && (
                <Badge className="rounded-full bg-brand-primary-light text-brand-primary">
                  შენი შეფასება
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <StarRating value={review.rating} size="sm" />
              <span className="text-sm tabular-nums text-brand-muted">
                {createdLabel}
              </span>
              {wasUpdated && (
                <span className="text-xs text-brand-muted">განახლებულია</span>
              )}
            </div>
          </div>
        </div>

        {review.isOwnReview && (
          <div className="flex flex-wrap items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => onEdit(review)}
              >
                <Edit3 className="size-4" />
                რედაქტირება
              </Button>
            )}
            <DeleteReviewButton
              endpoint={`/api/reviews/${review.id}`}
              dialogTitle="შეფასების წაშლა"
              dialogDescription="თუ ამ შეფასებას წაშლი, ის საჯაროდ აღარ გამოჩნდება. სურვილის შემთხვევაში მოგვიანებით ახალ შეფასებას ისევ დაამატებ."
              onDeleted={(payload) => {
                onDeleted?.({
                  reviewId: review.id,
                  summary: payload.summary,
                });
              }}
            />
          </div>
        )}
      </div>

      <p className="mt-4 whitespace-pre-line text-pretty text-sm leading-7 text-brand-secondary/90">
        {review.comment}
      </p>
    </article>
  );
}
