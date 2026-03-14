import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  badRequestResponse,
  conflictResponse,
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const enrollSchema = z.object({
  courseId: z.string().uuid("არასწორი კურსის ID"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const body = await parseJsonBody(request);

    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse({
        courseId: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { courseId } = parsed.data;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true },
    });

    if (!course) {
      return notFoundResponse();
    }

    if (course.status !== "PUBLISHED") {
      return badRequestResponse();
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: auth.userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return conflictResponse();
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: auth.userId,
        courseId,
      },
    });

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/enroll failed");
  }
}
