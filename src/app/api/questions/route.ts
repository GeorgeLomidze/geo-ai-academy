import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAdminNotificationDelegate, prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendAdminNewQuestionEmail } from "@/lib/email/send";
import {
  buildQuestionNotificationPreview,
  getEnrollmentAccessForLesson,
  getSerializedQuestionsForLesson,
  getUserRole,
  serializeQuestion,
} from "@/lib/qa";
import {
  getZodFieldErrors,
  questionCreateSchema,
  questionListQuerySchema,
} from "@/lib/validations/qa";
import { siteConfig } from "@/lib/constants";

function revalidateQARelatedPaths(courseSlug: string, lessonId: string) {
  revalidatePath(`/learn/${courseSlug}/${lessonId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/qa");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const parsed = questionListQuerySchema.safeParse({
      lessonId: request.nextUrl.searchParams.get("lessonId"),
    });

    if (!parsed.success) {
      const fieldErrors = getZodFieldErrors(parsed.error);
      return NextResponse.json(
        {
          error: Object.values(fieldErrors)[0] ?? "არასწორი მოთხოვნის პარამეტრები",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const { lessonId } = parsed.data;
    const [role, access] = await Promise.all([
      getUserRole(auth.userId),
      getEnrollmentAccessForLesson(auth.userId, lessonId),
    ]);

    if (!access) {
      return NextResponse.json(
        { error: "გაკვეთილი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    const isAdmin = role === "ADMIN";
    if (!isAdmin && !access.enrolled) {
      return NextResponse.json(
        { error: "კითხვა-პასუხის ნახვა მხოლოდ ჩაწერილ სტუდენტებს შეუძლიათ" },
        { status: 403 }
      );
    }

    const questions = await getSerializedQuestionsForLesson(
      lessonId,
      auth.userId,
      isAdmin
    );

    return NextResponse.json({
      questions,
      questionCount: questions.length,
      currentUser: {
        id: auth.userId,
        isAdmin,
      },
    });
  } catch (error) {
    console.error("GET /api/questions failed", error);
    return NextResponse.json(
      { error: "კითხვა-პასუხის ჩატვირთვა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const parsed = questionCreateSchema.safeParse(body);
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

    const { lessonId, content, imageUrl, imageUrls } = parsed.data;
    const [role, access, author] = await Promise.all([
      getUserRole(auth.userId),
      getEnrollmentAccessForLesson(auth.userId, lessonId),
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true,
        },
      }),
    ]);

    if (!access) {
      return NextResponse.json(
        { error: "გაკვეთილი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    if (role === "ADMIN" || !access.enrolled) {
      return NextResponse.json(
        { error: "კითხვის დასმა მხოლოდ ჩაწერილ სტუდენტებს შეუძლიათ" },
        { status: 403 }
      );
    }

    const question = await prisma.question.create({
      data: {
        content,
        imageUrl,
        imageUrls,
        lessonId,
        userId: auth.userId,
        adminReadAt: null,
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

    try {
      const adminNotification = getAdminNotificationDelegate();

      if (adminNotification) {
        await adminNotification.create({
          data: {
            type: "NEW_QUESTION",
            title: author?.name ?? author?.email ?? "სტუდენტი",
            message: buildQuestionNotificationPreview(content),
            linkUrl: `/admin/qa?questionId=${question.id}`,
          },
        });
      }
    } catch (notificationError) {
      console.error("POST /api/questions notification create failed", notificationError);
    }

    try {
      await sendAdminNewQuestionEmail({
        studentName: author?.name ?? author?.email ?? "სტუდენტი",
        courseName: access.course.title,
        lessonName: access.lesson.title,
        questionPreview: buildQuestionNotificationPreview(content),
        adminQaUrl: `${siteConfig.url}/admin/qa?questionId=${question.id}`,
      });
    } catch (emailError) {
      console.error("POST /api/questions email send failed", emailError);
    }

    revalidateQARelatedPaths(access.course.slug, lessonId);

    return NextResponse.json(
      {
        success: true,
        message: "კითხვა წარმატებით დაემატა",
        question: serializeQuestion(question, auth.userId, false),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/questions failed", error);
    return NextResponse.json(
      { error: "კითხვის დამატება ვერ მოხერხდა, სცადეთ თავიდან" },
      { status: 500 }
    );
  }
}
