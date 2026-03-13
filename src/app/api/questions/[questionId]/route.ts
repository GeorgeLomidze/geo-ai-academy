import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  getAdminNotificationDelegate,
  getUserNotificationDelegate,
  prisma,
} from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getUserRole, serializeQuestion } from "@/lib/qa";
import {
  getZodFieldErrors,
  questionUpdateSchema,
} from "@/lib/validations/qa";

interface QuestionRouteContext {
  params: Promise<{ questionId: string }>;
}

function revalidateQARelatedPaths(courseSlug: string, lessonId: string) {
  revalidatePath(`/learn/${courseSlug}/${lessonId}`);
  revalidatePath("/admin/qa");
}

export async function PUT(
  request: NextRequest,
  context: QuestionRouteContext
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

    const parsed = questionUpdateSchema.safeParse(body);
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

    const { questionId } = await context.params;
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        userId: true,
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
    });

    if (!question) {
      return NextResponse.json(
        { error: "კითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    if (question.userId !== auth.userId) {
      return NextResponse.json(
        { error: "თქვენ მხოლოდ საკუთარ კითხვას ჩაასწორებთ" },
        { status: 403 }
      );
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
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
        adminReadAt: true,
        userId: true,
        lessonId: true,
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
        answers: {
          orderBy: { createdAt: "asc" },
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
        },
      },
    });

    revalidateQARelatedPaths(
      question.lesson.module.course.slug,
      updatedQuestion.lessonId
    );

    return NextResponse.json({
      success: true,
      message: "კითხვა წარმატებით განახლდა",
      question: serializeQuestion(updatedQuestion, auth.userId, false),
    });
  } catch (error) {
    console.error("PUT /api/questions/[questionId] failed", error);
    return NextResponse.json(
      { error: "კითხვის განახლება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: QuestionRouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const [role, { questionId }] = await Promise.all([
      getUserRole(auth.userId),
      context.params,
    ]);

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "წვდომა აკრძალულია" },
        { status: 403 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
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
    });

    if (!question) {
      return NextResponse.json(
        { error: "კითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { adminReadAt: new Date() },
    });

    const adminNotification = getAdminNotificationDelegate();

    if (adminNotification) {
      await adminNotification.updateMany({
        where: {
          isRead: false,
          linkUrl: {
            contains: questionId,
          },
        },
        data: { isRead: true },
      });
    }

    revalidateQARelatedPaths(question.lesson.module.course.slug, question.lessonId);

    return NextResponse.json({
      success: true,
      message: "კითხვა წაკითხულად მოინიშნა",
    });
  } catch (error) {
    console.error("PATCH /api/questions/[questionId] failed", error);
    return NextResponse.json(
      { error: "კითხვის სტატუსის განახლება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: QuestionRouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const { questionId } = await context.params;
    const [role, question] = await Promise.all([
      getUserRole(auth.userId),
      prisma.question.findUnique({
        where: { id: questionId },
        select: {
          id: true,
          userId: true,
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
      }),
    ]);

    if (!question) {
      return NextResponse.json(
        { error: "კითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    const isAdmin = role === "ADMIN";
    if (!isAdmin && question.userId !== auth.userId) {
      return NextResponse.json(
        { error: "თქვენ მხოლოდ საკუთარ კითხვას წაშლით" },
        { status: 403 }
      );
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    const adminNotification = getAdminNotificationDelegate();
    const userNotification = getUserNotificationDelegate();

    await Promise.all([
      adminNotification
        ? adminNotification.deleteMany({
            where: {
              linkUrl: {
                contains: questionId,
              },
            },
          })
        : Promise.resolve(),
      userNotification
        ? userNotification.deleteMany({
            where: {
              questionId,
            },
          })
        : Promise.resolve(),
    ]);

    revalidateQARelatedPaths(question.lesson.module.course.slug, question.lessonId);

    return NextResponse.json({
      success: true,
      message: "კითხვა წარმატებით წაიშალა",
    });
  } catch (error) {
    console.error("DELETE /api/questions/[questionId] failed", error);
    return NextResponse.json(
      { error: "კითხვის წაშლა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
