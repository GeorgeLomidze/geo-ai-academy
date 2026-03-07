import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Resend } from "resend";
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
  console.log("[Admin Emails] === START ===");

  const auth = await requireAuth(request);
  console.log("[Admin Emails] Auth result:", auth.authenticated, auth.authenticated ? auth.userId : "N/A");
  if (!auth.authenticated) return auth.response;

  const dbUser = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, email: true },
  });
  console.log("[Admin Emails] DB user:", JSON.stringify(dbUser));

  if (dbUser?.role !== "ADMIN") {
    console.log("[Admin Emails] Not admin, returning 403");
    return NextResponse.json(
      { error: "მხოლოდ ადმინისტრატორს აქვს წვდომა" },
      { status: 403 }
    );
  }

  const body = await request.json();
  console.log("[Admin Emails] Request body:", JSON.stringify(body));

  const parsed = bulkEmailSchema.safeParse(body);
  if (!parsed.success) {
    console.log("[Admin Emails] Validation error:", JSON.stringify(parsed.error.issues));
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const { subject, body: emailBody, recipientType, courseId } = parsed.data;
  console.log("[Admin Emails] Parsed:", { subject, recipientType, courseId });

  // --- Direct Resend test ---
  console.log("[Admin Emails] Testing Resend directly...");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const testResult = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "GEO AI Academy <onboarding@resend.dev>",
    to: "giolomidze8989@gmail.com",
    subject: "Test from bulk email route",
    html: "<p>Test email — if you see this, Resend works.</p>",
  });
  console.log("[Admin Emails] Resend test result:", JSON.stringify(testResult));
  // --- End direct test ---

  let emails: string[];

  if (recipientType === "course" && courseId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { user: { select: { email: true } } },
    });
    emails = enrollments.map((e) => e.user.email);
    console.log("[Admin Emails] Course recipients:", emails.length, "courseId:", courseId, "emails:", emails);
  } else {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { email: true },
    });
    console.log("[Admin Emails] Raw Prisma result:", JSON.stringify(students));
    emails = students.map((s) => s.email);
    console.log("[Admin Emails] All student recipients:", emails.length, "emails:", emails);
  }

  if (emails.length === 0) {
    console.log("[Admin Emails] No recipients found, returning 404");
    return NextResponse.json(
      { error: "მიმღებები ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  const html = emailLayout(
    `<div style="font-size:15px;line-height:1.7;color:#e0e0e0;">${emailBody}</div>`
  );

  console.log("[Admin Emails] Calling sendBulkEmail with", emails.length, "recipients");
  const result = await sendBulkEmail(emails, subject, html);
  console.log("[Admin Emails] sendBulkEmail result:", JSON.stringify(result));
  console.log("[Admin Emails] === END ===");

  return NextResponse.json({
    success: true,
    totalRecipients: emails.length,
    ...result,
  });
}
