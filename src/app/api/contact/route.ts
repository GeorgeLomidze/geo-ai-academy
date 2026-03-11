import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { sendContactNotification } from "@/lib/email/send";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().min(2, "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
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
  const auth = await requireAuth(request);

  if (!auth.authenticated) {
    return auth.response;
  }

  const body: unknown = await request.json();
  const result = contactSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const { name, subject, message } = result.data;

  const sender = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { email: true, name: true },
  });

  if (!sender?.email) {
    return NextResponse.json(
      { error: "მომხმარებლის ელ-ფოსტა ვერ მოიძებნა" },
      { status: 400 }
    );
  }

  try {
    await sendContactNotification(
      name || sender.name || "მომხმარებელი",
      sender.email,
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
