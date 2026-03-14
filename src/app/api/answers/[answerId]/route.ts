import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  forbiddenResponse,
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { getUserNotificationDelegate, prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getUserRole, serializeAnswer } from "@/lib/qa";
import {
  answerUpdateSchema,
  getZodFieldErrors,
} from "@/lib/validations/qa";

interface AnswerRouteContext {
  params: Promise<{ answerId: string }>;
}

function revalidateQARelatedPaths(courseSlug: string, lessonId: string) {
  revalidatePath(`/learn/${courseSlug}/${lessonId}`);
  revalidatePath("/admin/qa");
}

export async function PUT(
  request: NextRequest,
  context: AnswerRouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const body = await parseJsonBody(request);

    const parsed = answerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = getZodFieldErrors(parsed.error);
      return validationErrorResponse(fieldErrors);
    }

    const { answerId } = await context.params;
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: {
        id: true,
        userId: true,
        question: {
          select: {
            lessonId: true,
            lesson: {
              select: {
                module: {
                  select: {
                    course: {
                      select: {
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!answer) {
      return notFoundResponse();
    }

    if (answer.userId !== auth.userId) {
      return forbiddenResponse();
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl,
        imageUrls: parsed.data.imageUrls,
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        imageUrls: true,
        userId: true,
        questionId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    revalidateQARelatedPaths(
      answer.question.lesson.module.course.slug,
      answer.question.lessonId
    );

    return NextResponse.json({
      success: true,
      message: "პასუხი წარმატებით განახლდა",
      answer: serializeAnswer(updatedAnswer, auth.userId, false),
    });
  } catch (error) {
    return handleApiError(error, "PUT /api/answers/[answerId] failed");
  }
}

export async function DELETE(
  request: NextRequest,
  context: AnswerRouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const { answerId } = await context.params;
    const [role, answer] = await Promise.all([
      getUserRole(auth.userId),
      prisma.answer.findUnique({
        where: { id: answerId },
        select: {
          id: true,
          userId: true,
          question: {
            select: {
              lessonId: true,
              lesson: {
                select: {
                  module: {
                    select: {
                      course: {
                        select: {
                          slug: true,
                        },
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

    if (!answer) {
      return notFoundResponse();
    }

    const isAdmin = role === "ADMIN";
    if (!isAdmin && answer.userId !== auth.userId) {
      return forbiddenResponse();
    }

    await prisma.answer.delete({
      where: { id: answerId },
    });

    const userNotification = getUserNotificationDelegate();

    if (userNotification) {
      await userNotification.deleteMany({
        where: {
          answerId,
        },
      });
    }

    revalidateQARelatedPaths(
      answer.question.lesson.module.course.slug,
      answer.question.lessonId
    );

    return NextResponse.json({
      success: true,
      message: "პასუხი წარმატებით წაიშალა",
    });
  } catch (error) {
    return handleApiError(error, "DELETE /api/answers/[answerId] failed");
  }
}
