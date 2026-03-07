"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  formatRatingValue,
  REVIEW_RATING_INPUT_VALUES,
  type ReviewRatingValue,
} from "@/lib/review-constants";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  readOnly?: boolean;
  onChange?: (value: ReviewRatingValue) => void;
  name?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  error?: boolean;
  disabled?: boolean;
}

const starSizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

const starGapClasses = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1",
} as const;

function getStarFill(value: number, starIndex: number) {
  const current = value - (starIndex - 1);

  if (current >= 1) {
    return 100;
  }

  if (current >= 0.5) {
    return 50;
  }

  return 0;
}

function StarsDisplay({
  value,
  size,
  muted = false,
}: {
  value: number;
  size: "sm" | "md" | "lg";
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-center", starGapClasses[size])} aria-hidden>
      {Array.from({ length: 5 }, (_, index) => {
        const fill = getStarFill(value, index + 1);

        return (
          <span key={index} className="relative inline-flex">
            <Star
              className={cn(
                starSizeClasses[size],
                muted ? "text-brand-border" : "text-brand-border"
              )}
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill}%` }}
            >
              <Star
                className={cn(
                  starSizeClasses[size],
                  muted
                    ? "fill-brand-accent text-brand-accent"
                    : "fill-brand-accent text-brand-accent"
                )}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function StarRating({
  value,
  readOnly = true,
  onChange,
  name = "rating",
  label = "შეფასება",
  className,
  size = "md",
  error = false,
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  if (readOnly || !onChange) {
    return (
      <div
        role="img"
        aria-label={`შეფასება ${formatRatingValue(value)} 5-დან`}
        className={className}
      >
        <StarsDisplay value={value} size={size} muted />
      </div>
    );
  }

  return (
    <fieldset className={cn("space-y-3", className)} disabled={disabled}>
      <legend className="text-sm font-medium text-brand-secondary">{label}</legend>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "relative inline-flex rounded-2xl border border-brand-border bg-brand-surface px-2 py-2 transition-shadow focus-within:ring-2 focus-within:ring-brand-primary/20",
            error && "border-brand-danger/30 bg-brand-danger/10"
          )}
          onMouseLeave={() => setHoverValue(null)}
        >
          <StarsDisplay value={displayValue} size={size} />

          <div className="absolute inset-0 grid grid-cols-10">
            {REVIEW_RATING_INPUT_VALUES.map((rating) => (
              <label
                key={rating}
                className={cn(
                  "block h-full cursor-pointer rounded-xl",
                  disabled && "cursor-not-allowed"
                )}
                onMouseEnter={() => {
                  if (!disabled) {
                    setHoverValue(rating);
                  }
                }}
              >
                <input
                  type="radio"
                  name={name}
                  value={rating}
                  checked={value === rating}
                  onChange={() => onChange(rating)}
                  onFocus={() => setHoverValue(rating)}
                  onBlur={() => setHoverValue(null)}
                  disabled={disabled}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={`${formatRatingValue(rating)} ვარსკვლავი`}
                />
                <span className="sr-only">
                  {formatRatingValue(rating)} ვარსკვლავი
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-brand-primary-light px-3 py-2 text-sm font-semibold tabular-nums text-brand-primary">
          {displayValue > 0 ? formatRatingValue(displayValue) : "აირჩიე"}
        </div>
      </div>
    </fieldset>
  );
}
