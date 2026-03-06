export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, MessageSquareText } from "lucide-react";
import { REVIEW_RATING_VALUES, formatRatingValue } from "@/lib/review-constants";
import { getAdminReviews } from "@/lib/reviews";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteReviewButton } from "@/components/reviews/DeleteReviewButton";
import { StarRating } from "@/components/reviews/StarRating";

interface AdminReviewsPageProps {
  searchParams: Promise<{
    q?: string;
    rating?: string;
  }>;
}

const reviewDateFormatter = new Intl.DateTimeFormat("ka-GE", {
  year: "numeric",
  month: "short",
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

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const rating = params.rating?.trim() ?? "";
  const reviews = await getAdminReviews({ query, rating });
  const hasFilters = Boolean(query || rating);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-secondary">
            შეფასებები
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            სტუდენტების კომენტარების ნახვა, ძიება და საჭიროების შემთხვევაში
            მოდერაცია
          </p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-muted">
          სულ {reviews.length} ჩანაწერი
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        <form className="grid gap-3 border-b border-brand-border p-4 lg:grid-cols-[1fr_180px_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="მოძებნე სტუდენტი ან კურსი..."
              className="h-11 rounded-xl pl-9"
              aria-label="შეფასების ძიება"
            />
          </div>

          <label className="flex items-center">
            <span className="sr-only">შეფასების ფილტრი</span>
            <select
              name="rating"
              defaultValue={rating}
              className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm text-brand-secondary outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="შეფასების ფილტრი"
            >
              <option value="">ყველა შეფასება</option>
              {REVIEW_RATING_VALUES.map((value) => (
                <option key={value} value={value}>
                  {formatRatingValue(value)} ვარსკვლავი
                </option>
              ))}
            </select>
          </label>

          <Button type="submit" className="h-11 rounded-xl">
            გაფილტვრა
          </Button>

          {hasFilters ? (
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/admin/reviews">გასუფთავება</Link>
            </Button>
          ) : (
            <div />
          )}
        </form>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary-light">
              <MessageSquareText className="size-6 text-brand-primary" />
            </div>
            <h2 className="mt-4 text-balance font-display text-xl font-bold text-brand-secondary">
              შეფასებები ვერ მოიძებნა
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-brand-muted">
              შეცვალე ძიების ტექსტი ან ფილტრი და სცადე თავიდან.
            </p>
            {hasFilters && (
              <Button asChild className="mt-5 rounded-xl">
                <Link href="/admin/reviews">ფილტრების გასუფთავება</Link>
              </Button>
            )}
          </div>
        ) : (
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
                  შეფასება
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  კომენტარი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  თარიღი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  მოქმედება
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} className="border-brand-border">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={review.user.avatarUrl ?? undefined}
                          alt={review.user.name ?? "სტუდენტი"}
                        />
                        <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                          {getInitials(review.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-brand-secondary">
                          {review.user.name ?? "უსახელო სტუდენტი"}
                        </p>
                        <p className="text-xs text-brand-muted">{review.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <Link
                      href={`/courses/${review.course.slug}`}
                      className="font-medium text-brand-secondary hover:text-brand-primary"
                    >
                      {review.course.title}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <StarRating value={Number(review.rating)} size="sm" />
                      <span className="tabular-nums text-brand-secondary">
                        {formatRatingValue(Number(review.rating))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 align-top whitespace-normal">
                    <p className="line-clamp-2 max-w-md text-pretty text-sm leading-6 text-brand-secondary/90">
                      {review.comment}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 text-sm tabular-nums text-brand-muted">
                    {reviewDateFormatter.format(review.createdAt)}
                  </TableCell>
                  <TableCell className="px-4">
                    <DeleteReviewButton
                      endpoint={`/api/admin/reviews/${review.id}`}
                      dialogTitle="შეფასების წაშლა"
                      dialogDescription="ეს შეფასება წაიშლება როგორც ადმინის მოდერაციის ნაწილი და საჯაროდ აღარ გამოჩნდება."
                      iconOnly
                      label="შეფასების წაშლა"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
