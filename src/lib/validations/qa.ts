import { z } from "zod/v4";

function normalizeContent(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

const lessonIdSchema = z
  .string()
  .trim()
  .min(1, "გაკვეთილი სავალდებულოა")
  .uuid("გაკვეთილის ID არასწორია");

const questionIdSchema = z
  .string()
  .trim()
  .min(1, "კითხვა სავალდებულოა")
  .uuid("კითხვის ID არასწორია");

const contentSchema = z
  .string()
  .transform((value) => normalizeContent(value))
  .refine((value) => value.length > 0, {
    message: "ტექსტის შევსება სავალდებულოა",
  })
  .refine((value) => value.length <= 2000, {
    message: "ტექსტი მაქსიმუმ 2000 სიმბოლოს უნდა შეიცავდეს",
  });

const imageUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  })
  .refine(
    (value) => value === null || z.url().safeParse(value).success,
    { message: "სურათის ბმული არასწორია" }
  );

const imageUrlsSchema = z
  .array(z.string().trim())
  .max(6, "მაქსიმუმ 6 სურათის დამატებაა შესაძლებელი")
  .transform((values) =>
    values
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  )
  .refine(
    (values) => values.every((value) => z.url().safeParse(value).success),
    { message: "სურათის ბმული არასწორია" }
  );

function buildImageFieldsSchema() {
  return z
    .object({
      imageUrl: imageUrlSchema.optional(),
      imageUrls: imageUrlsSchema.optional(),
    })
    .transform(({ imageUrl, imageUrls }) => {
      const normalizedImageUrls = imageUrls ?? (imageUrl ? [imageUrl] : []);

      return {
        imageUrl: normalizedImageUrls[0] ?? null,
        imageUrls: normalizedImageUrls,
      };
    });
}

export const questionListQuerySchema = z.object({
  lessonId: lessonIdSchema,
});

export const questionCreateSchema = z
  .object({
    lessonId: lessonIdSchema,
    content: contentSchema,
  })
  .and(buildImageFieldsSchema());

export const questionUpdateSchema = z
  .object({
    content: contentSchema,
  })
  .and(buildImageFieldsSchema());

export const answerCreateSchema = z
  .object({
    questionId: questionIdSchema,
    content: contentSchema,
  })
  .and(buildImageFieldsSchema());

export const answerUpdateSchema = z
  .object({
    content: contentSchema,
  })
  .and(buildImageFieldsSchema());

export const notificationUpdateSchema = z
  .object({
    id: z.string().trim().uuid("შეტყობინების ID არასწორია").optional(),
    questionId: z.string().trim().uuid("კითხვის ID არასწორია").optional(),
    markAllRead: z.boolean().optional(),
  })
  .refine((value) => value.markAllRead || value.id || value.questionId, {
    message: "მიუთითეთ შეტყობინება, კითხვა ან ყველა წაკითხულად მონიშვნა",
    path: ["id"],
  });

export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type AnswerCreateInput = z.infer<typeof answerCreateSchema>;
export type AnswerUpdateInput = z.infer<typeof answerUpdateSchema>;

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
