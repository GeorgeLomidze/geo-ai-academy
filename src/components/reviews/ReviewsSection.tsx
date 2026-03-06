"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { CourseRatingSummary, SerializedReview } from "@/lib/reviews";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Button } from "@/components/ui/button";

interface ReviewsSectionProps {
  courseId: string;
  summary: CourseRatingSummary;
  reviews: SerializedReview[];
  currentUserReview: SerializedReview | null;
  isAuthenticated: boolean;
  isEnrolled: boolean;
}

function sortByNewest(reviews: SerializedReview[]) {
  return [...reviews].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function ReviewsSection({
  courseId,
  summary: initialSummary,
  reviews: initialReviews,
  currentUserReview: initialCurrentUserReview,
  isAuthenticated,
  isEnrolled,
}: ReviewsSectionProps) {
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState(initialSummary);
  const [reviews, setReviews] = useState(initialReviews);
  const [currentUserReview, setCurrentUserReview] = useState(initialCurrentUserReview);
  const [editingReview, setEditingReview] = useState(initialCurrentUserReview);

  function scrollToForm() {
    formContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const canReview = isAuthenticated && isEnrolled;

  return (
    <section id="reviews" className="border-t border-brand-border/80 py-12 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-balance font-display text-3xl font-bold text-brand-secondary">
            სტუდენტების შეფასებები
          </h2>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-brand-muted sm:text-base">
            ნახე რას ფიქრობენ კურსის უკვე გავლილი სტუდენტები და, თუ ჩაწერილი
            ხარ, შენც გაუზიარე შენი გამოცდილება.
          </p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-muted">
          სულ {summary.totalReviews} შეფასება
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6" ref={formContainerRef}>
          <RatingSummary summary={summary} />

          {canReview ? (
            <ReviewForm
              courseId={courseId}
              initialReview={editingReview}
              onSaved={({ review, summary: nextSummary }) => {
                setCurrentUserReview(review);
                setEditingReview(review);
                setSummary(nextSummary);
                setReviews((current) =>
                  sortByNewest([review, ...current.filter((item) => item.id !== review.id)])
                );
              }}
            />
          ) : isAuthenticated ? (
            <div className="rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm">
              <h3 className="text-balance font-display text-xl font-bold text-brand-secondary">
                შეფასება მხოლოდ ჩაწერილი სტუდენტებისთვისაა
              </h3>
              <p className="mt-2 text-pretty text-sm leading-6 text-brand-muted">
                კომენტარისა და ვარსკვლავური შეფასების დამატება მხოლოდ იმ
                მომხმარებლებს შეუძლიათ, ვინც ამ კურსზე უკვე არიან ჩაწერილები.
              </p>
              <Button asChild className="mt-5 rounded-xl">
                <Link href="#course-cta">კურსზე ჩაწერის ნახვა</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm">
              <h3 className="text-balance font-display text-xl font-bold text-brand-secondary">
                ავტორიზაცია საჭიროა
              </h3>
              <p className="mt-2 text-pretty text-sm leading-6 text-brand-muted">
                შეფასების დასატოვებლად ჯერ შედი ანგარიშში, შემდეგ ჩაეწერე კურსზე
                და გაუზიარე შენი გამოცდილება.
              </p>
              <Button asChild className="mt-5 rounded-xl">
                <Link href="/login">შესვლა</Link>
              </Button>
            </div>
          )}
        </div>

        <div>
          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-brand-border bg-brand-surface p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-primary-light">
                <MessageSquareText className="size-6 text-brand-primary" />
              </div>
              <h3 className="mt-4 text-balance font-display text-xl font-bold text-brand-secondary">
                ჯერ არავის დაუტოვებია შეფასება
              </h3>
              <p className="mt-2 text-pretty text-sm leading-6 text-brand-muted">
                ეს კურსი ელოდება პირველ რეალურ შეფასებას სტუდენტისგან.
              </p>
              {canReview ? (
                <Button type="button" className="mt-5 rounded-xl" onClick={scrollToForm}>
                  იყავი პირველი შემფასებელი
                </Button>
              ) : !isAuthenticated ? (
                <Button asChild className="mt-5 rounded-xl">
                  <Link href="/login">შესვლა და შეფასება</Link>
                </Button>
              ) : (
                <Button asChild className="mt-5 rounded-xl">
                  <Link href="#course-cta">კურსზე ჩაწერა</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onEdit={(selectedReview) => {
                    setEditingReview(selectedReview);
                    scrollToForm();
                  }}
                  onDeleted={({ reviewId, summary: nextSummary }) => {
                    setReviews((current) => current.filter((item) => item.id !== reviewId));
                    if (currentUserReview?.id === reviewId) {
                      setCurrentUserReview(null);
                      setEditingReview(null);
                    }
                    if (nextSummary) {
                      setSummary(nextSummary);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
