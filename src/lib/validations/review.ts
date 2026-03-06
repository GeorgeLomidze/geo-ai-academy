import { z } from "zod/v4";
import { normalizeReviewComment } from "@/lib/review-constants";

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

const courseIdSchema = z
  .string()
  .trim()
  .min(1, "კურსი სავალდებულოა")
  .uuid("კურსის ID არასწორია");

const ratingSchema = z
  .unknown()
  .transform((value, ctx) => {
    const parsed = parseNumber(value);

    if (parsed === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "შეფასების არჩევა სავალდებულოა",
      });
      return z.NEVER;
    }

    return parsed;
  })
  .refine((value) => value >= 1, {
    message: "შეფასება მინიმუმ 1 უნდა იყოს",
  })
  .refine((value) => value <= 5, {
    message: "შეფასება მაქსიმუმ 5 უნდა იყოს",
  })
  .refine((value) => Number.isInteger(value * 2), {
    message: "შეფასება მხოლოდ 0.5-იანი ნაბიჯებით არის შესაძლებელი",
  });

const commentSchema = z
  .string()
  .transform((value) => normalizeReviewComment(value))
  .refine((value) => value.length > 0, {
    message: "კომენტარის შევსება სავალდებულოა",
  })
  .refine((value) => value.length <= 1000, {
    message: "კომენტარი მაქსიმუმ 1000 სიმბოლოს უნდა შეიცავდეს",
  });

export const reviewUpsertSchema = z.object({
  courseId: courseIdSchema,
  rating: ratingSchema,
  comment: commentSchema,
});

export const reviewListQuerySchema = z.object({
  courseId: courseIdSchema,
  limit: z.coerce.number().int().min(1).max(50).default(10),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});

export type ReviewUpsertInput = z.infer<typeof reviewUpsertSchema>;
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;

export function getZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = String(issue.path[0] ?? "root");
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}
