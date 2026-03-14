import { NextRequest, NextResponse } from "next/server";
import {
  forbiddenResponse,
  handleApiError,
  notFoundResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { LESSON_ATTACHMENTS_BUCKET } from "@/lib/lesson-attachments";
import { prisma } from "@/lib/prisma";
import { createStorageClient } from "@/lib/supabase/storage";

interface AttachmentRouteContext {
  params: Promise<{ attachmentId: string }>;
}

export async function GET(
  request: NextRequest,
  context: AttachmentRouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const { attachmentId } = await context.params;
    const [role, attachment] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { role: true },
      }),
      prisma.lessonAttachment.findUnique({
        where: { id: attachmentId },
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          lesson: {
            select: {
              module: {
                select: {
                  course: {
                    select: {
                      enrollments: {
                        where: { userId: auth.userId },
                        select: { id: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    if (!attachment) {
      return notFoundResponse();
    }

    const isAdmin = role?.role === "ADMIN";
    const isEnrolled = attachment.lesson.module.course.enrollments.length > 0;

    if (!isAdmin && !isEnrolled) {
      return forbiddenResponse();
    }

    const supabase = createStorageClient();
    const { data, error } = await supabase.storage
      .from(LESSON_ATTACHMENTS_BUCKET)
      .createSignedUrl(attachment.fileUrl, 60, {
        download: attachment.fileName,
      });

    if (error || !data?.signedUrl) {
      throw error ?? new Error("მასალის ჩამოტვირთვა ვერ მოხერხდა");
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    return handleApiError(error, "GET /api/attachments/[attachmentId] failed");
  }
}
