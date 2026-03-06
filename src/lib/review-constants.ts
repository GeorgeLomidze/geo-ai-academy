export const REVIEW_RATING_VALUES = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1] as const;

export const REVIEW_RATING_INPUT_VALUES = [
  1,
  1.5,
  2,
  2.5,
  3,
  3.5,
  4,
  4.5,
  5,
] as const;

export type ReviewRatingValue = (typeof REVIEW_RATING_VALUES)[number];

export function formatRatingValue(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function getRatingBreakdownKey(value: number): string {
  return formatRatingValue(value);
}

export function normalizeReviewComment(comment: string): string {
  return comment.replace(/\r\n/g, "\n").trim();
}
