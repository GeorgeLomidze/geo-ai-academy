import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { formatRatingValue } from "@/lib/review-constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/course/PriceTag";
import { StarRating } from "@/components/reviews/StarRating";

interface CourseCardProps {
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
  lessonCount: number;
  averageRating?: number | null;
  totalReviews?: number;
  status?: string;
}

export function CourseCard({
  title,
  slug,
  shortDescription,
  thumbnailUrl,
  price,
  lessonCount,
  averageRating = null,
  totalReviews = 0,
}: CourseCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition-all duration-300 will-change-transform hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(245,166,35,0.1)]">
      {/* Thumbnail */}
      <Link
        href={`/courses/${slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-brand-accent/10"
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary/15 backdrop-blur-sm">
              <BookOpen className="size-7 text-brand-primary" />
            </div>
          </div>
        )}

        {/* Price badge overlay */}
        {price === 0 && (
          <Badge className="absolute left-3 top-3 rounded-xl border-brand-accent/20 bg-brand-accent/15 text-xs font-semibold text-brand-accent">
            უფასო
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <Link href={`/courses/${slug}`}>
          <h3 className="font-display text-lg font-bold leading-snug text-brand-secondary transition-colors group-hover:text-brand-primary">
            {title}
          </h3>
        </Link>

        {/* Description */}
        {shortDescription && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-brand-muted">
            {shortDescription}
          </p>
        )}
        {!shortDescription && <div className="flex-1" />}

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {lessonCount} გაკვეთილი
          </span>
          {totalReviews > 0 && averageRating ? (
            <span className="flex items-center gap-2 rounded-full bg-brand-surface-light px-2.5 py-1 text-brand-secondary">
              <StarRating value={averageRating} size="sm" />
              <span className="font-semibold tabular-nums">
                {formatRatingValue(averageRating)}
              </span>
              <span className="text-brand-muted">({totalReviews})</span>
            </span>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-4">
          <PriceTag price={price} size="sm" />
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-brand-primary text-black transition-all duration-200 hover:scale-[1.02] hover:bg-brand-primary-hover"
          >
            <Link href={`/courses/${slug}`}>დეტალურად</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
