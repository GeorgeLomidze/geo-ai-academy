import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { sendContactNotification } from "@/lib/email/send";

const contactSchema = z.object({
  name: z.string().min(2, "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
  email: z.email("გთხოვთ შეიყვანოთ სწორი ელ-ფოსტა"),
  subject: z
    .string()
    .min(2, "თემა უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს")
    .max(120, "თემა არ უნდა აღემატებოდეს 120 სიმბოლოს"),
  message: z
    .string()
    .min(10, "შეტყობინება უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს")
    .max(2000, "შეტყობინება არ უნდა აღემატებოდეს 2000 სიმბოლოს"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "message")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { name, email, subject, message } = result.data;

    await sendContactNotification(
      name,
      email,
      subject,
      message
    );
  } catch (error) {
    return handleApiError(error, "POST /api/contact failed");
  }

  return NextResponse.json({ success: true });
}
