import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail } from "@/lib/email/send";
import { emailLayout } from "@/lib/email/templates/layout";

const bulkEmailSchema = z.object({
  subject: z.string().min(1, "სათაური აუცილებელია"),
  body: z.string().min(1, "ტექსტი აუცილებელია"),
  recipientType: z.enum(["all", "course"]),
  courseId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  const dbUser = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });

  if (dbUser?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "მხოლოდ ადმინისტრატორს აქვს წვდომა" },
      { status: 403 }
    );
  }

  const parsed = bulkEmailSchema.safeParse(await request.json());
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const { subject, body, recipientType, courseId } = parsed.data;

  let emails: string[];

  if (recipientType === "course" && courseId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { user: { select: { email: true } } },
    });
    emails = enrollments.map((e) => e.user.email);
  } else {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { email: true },
    });
    emails = students.map((s) => s.email);
  }

  if (emails.length === 0) {
    return NextResponse.json(
      { error: "მიმღებები ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  const html = emailLayout(
    `<div style="font-size:15px;line-height:1.7;color:#e0e0e0;">${body}</div>`
  );

  const result = await sendBulkEmail(emails, subject, html);

  return NextResponse.json({
    success: true,
    totalRecipients: emails.length,
    ...result,
  });
}
