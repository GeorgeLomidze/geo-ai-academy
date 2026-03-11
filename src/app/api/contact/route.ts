import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
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
  const body: unknown = await request.json();
  const result = contactSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = result.data;

  try {
    await sendContactNotification(
      name,
      email,
      subject,
      message
    );
  } catch {
    return NextResponse.json(
      { error: "შეტყობინების გაგზავნა ვერ მოხერხდა" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
