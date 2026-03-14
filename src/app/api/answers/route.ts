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
import { sendQuestionAnsweredEmail } from "@/lib/email/send";
import {
  buildQuestionNotificationPreview,
  getEnrollmentAccessForLesson,
  getUserRole,
  serializeAnswer,
} from "@/lib/qa";
import {
  answerCreateSchema,
  getZodFieldErrors,
} from "@/lib/validations/qa";
import { siteConfig } from "@/lib/constants";

function revalidateQARelatedPaths(courseSlug: string, lessonId: string) {
  revalidatePath(`/learn/${courseSlug}/${lessonId}`);
  revalidatePath("/admin/qa");
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const body = await parseJsonBody(request);

    const parsed = answerCreateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = getZodFieldErrors(parsed.error);
      return validationErrorResponse(fieldErrors);
    }

    const { questionId, content, imageUrl, imageUrls } = parsed.data;
    const [role, question] = await Promise.all([
      getUserRole(auth.userId),
      prisma.question.findUnique({
        where: { id: questionId },
        select: {
          id: true,
          userId: true,
          content: true,
          lessonId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  course: {
                    select: {
                      slug: true,
                      title: true,
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
      return notFoundResponse();
    }

    const access = await getEnrollmentAccessForLesson(auth.userId, question.lessonId);

    if (!access) {
      return notFoundResponse();
    }

    const isAdmin = role === "ADMIN";

    if (!isAdmin && !access.enrolled) {
      return forbiddenResponse();
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        imageUrl,
        imageUrls,
        questionId,
        userId: auth.userId,
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

    if (question.userId !== auth.userId) {
      const answerAuthor = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          name: true,
          email: true,
        },
      });

      const userNotification = getUserNotificationDelegate();

      if (userNotification) {
        await userNotification.create({
          data: {
            userId: question.userId,
            type: isAdmin ? "ADMIN_ANSWER" : "NEW_ANSWER",
            title:
              answerAuthor?.name ??
              answerAuthor?.email ??
              (isAdmin ? "ადმინისტრატორი" : "მომხმარებელი"),
            message: buildQuestionNotificationPreview(content),
            linkUrl: `/learn/${access.course.slug}/${access.lesson.id}#qa-section`,
            questionId,
            answerId: answer.id,
          },
        });
      }

      if (question.user.email) {
        try {
          await sendQuestionAnsweredEmail({
            email: question.user.email,
            recipientName: question.user.name,
            answererName:
              answerAuthor?.name ??
              answerAuthor?.email ??
              (isAdmin ? "ტრენერი" : "მომხმარებელი"),
            answerPreview: buildQuestionNotificationPreview(content),
            courseName: access.course.title,
            lessonUrl: `${siteConfig.url}/learn/${access.course.slug}/${access.lesson.id}#qa-section`,
            answeredByAdmin: isAdmin,
          });
        } catch (emailError) {
          console.error("POST /api/answers email send failed", emailError);
        }
      }
    }

    revalidateQARelatedPaths(access.course.slug, access.lesson.id);

    return NextResponse.json(
      {
        success: true,
        message: "პასუხი წარმატებით დაემატა",
        answer: serializeAnswer(answer, auth.userId, isAdmin),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/answers failed");
  }
}
