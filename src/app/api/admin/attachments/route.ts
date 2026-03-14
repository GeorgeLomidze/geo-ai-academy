import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  badRequestResponse,
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import {
  isAllowedLessonAttachment,
  LESSON_ATTACHMENTS_BUCKET,
  MAX_LESSON_ATTACHMENT_SIZE,
  sanitizeAttachmentFileName,
  serializeLessonAttachment,
} from "@/lib/lesson-attachments";
import { prisma } from "@/lib/prisma";
import { createStorageClient, ensureBucket } from "@/lib/supabase/storage";

const deleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid("არასწორი მასალის ID"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return badRequestResponse();
    }

    const lessonId = String(formData.get("lessonId") ?? "");
    const parsedLessonId = z.string().uuid("არასწორი გაკვეთილის ID").safeParse(lessonId);

    if (!parsedLessonId.success) {
      return validationErrorResponse({ lessonId: "გაკვეთილი ვერ მოიძებნა" });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return validationErrorResponse({ file: "ფაილი არ არის არჩეული" });
    }

    if (!isAllowedLessonAttachment(file)) {
      return validationErrorResponse({ file: "ფაილის ფორმატი მხარდაუჭერელია" });
    }

    if (file.size > MAX_LESSON_ATTACHMENT_SIZE) {
      return validationErrorResponse({
        file: "ფაილის ზომა არ უნდა აღემატებოდეს 50MB-ს",
      });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: parsedLessonId.data },
      select: { id: true },
    });

    if (!lesson) {
      return notFoundResponse();
    }

    const safeFileName = sanitizeAttachmentFileName(file.name);
    const uniqueFileName = `${randomUUID()}-${safeFileName}`;
    const storagePath = `lessons/${lesson.id}/${uniqueFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createStorageClient();
    await ensureBucket(supabase, LESSON_ATTACHMENTS_BUCKET, { public: false });

    const { error } = await supabase.storage
      .from(LESSON_ATTACHMENTS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const attachment = await prisma.lessonAttachment.create({
      data: {
        fileName: file.name,
        fileUrl: storagePath,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        lessonId: lesson.id,
      },
    });

    return NextResponse.json(
      { attachment: serializeLessonAttachment(attachment) },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/admin/attachments failed");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await parseJsonBody(request);
    const parsed = deleteAttachmentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse({ attachmentId: "არასწორი მასალის ID" });
    }

    const attachment = await prisma.lessonAttachment.findUnique({
      where: { id: parsed.data.attachmentId },
    });

    if (!attachment) {
      return notFoundResponse();
    }

    const supabase = createStorageClient();
    const { error } = await supabase.storage
      .from(LESSON_ATTACHMENTS_BUCKET)
      .remove([attachment.fileUrl]);

    if (error) {
      throw error;
    }

    await prisma.lessonAttachment.delete({
      where: { id: attachment.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/attachments failed");
  }
}
