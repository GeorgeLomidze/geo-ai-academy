import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "არასწორი მოთხოვნა" },
        { status: 400 }
      );
    }

    const parsed = answerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = getZodFieldErrors(parsed.error);
      return NextResponse.json(
        {
          error: Object.values(fieldErrors)[0] ?? "არასწორი მონაცემები",
          fieldErrors,
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "პასუხი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    if (answer.userId !== auth.userId) {
      return NextResponse.json(
        { error: "თქვენ მხოლოდ საკუთარ პასუხს ჩაასწორებთ" },
        { status: 403 }
      );
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl,
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
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
    console.error("PUT /api/answers/[answerId] failed", error);
    return NextResponse.json(
      { error: "პასუხის განახლება ვერ მოხერხდა" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "პასუხი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    const isAdmin = role === "ADMIN";
    if (!isAdmin && answer.userId !== auth.userId) {
      return NextResponse.json(
        { error: "თქვენ მხოლოდ საკუთარ პასუხს წაშლით" },
        { status: 403 }
      );
    }

    await prisma.answer.delete({
      where: { id: answerId },
    });

    revalidateQARelatedPaths(
      answer.question.lesson.module.course.slug,
      answer.question.lessonId
    );

    return NextResponse.json({
      success: true,
      message: "პასუხი წარმატებით წაიშალა",
    });
  } catch (error) {
    console.error("DELETE /api/answers/[answerId] failed", error);
    return NextResponse.json(
      { error: "პასუხის წაშლა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
