import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail } from "@/lib/email/send";
import { emailLayout } from "@/lib/email/templates/layout";
import { logDebug } from "@/lib/logger";

const bulkEmailSchema = z.object({
  subject: z.string().min(1, "სათაური აუცილებელია"),
  body: z.string().min(1, "ტექსტი აუცილებელია"),
  recipientType: z.enum(["all", "course"]),
  courseId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const parsed = bulkEmailSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse({
        [String(parsed.error.issues[0]?.path[0] ?? "subject")]:
          parsed.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { subject, body: content, recipientType, courseId } = parsed.data;

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
      return notFoundResponse();
    }

    const html = emailLayout(
      `<div style="font-size:15px;line-height:1.7;color:#e0e0e0;">${content}</div>`
    );

    logDebug("[Admin Emails] Sending bulk email", {
      recipientType,
      totalRecipients: emails.length,
    });

    const result = await sendBulkEmail(emails, subject, html);

    return NextResponse.json({
      success: true,
      totalRecipients: emails.length,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/emails failed");
  }
}
