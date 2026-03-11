import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  getEnrollmentAccessForLesson,
  getUserRole,
  serializeAnswer,
} from "@/lib/qa";
import {
  answerCreateSchema,
  getZodFieldErrors,
} from "@/lib/validations/qa";

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "არასწორი მოთხოვნა" },
        { status: 400 }
      );
    }

    const parsed = answerCreateSchema.safeParse(body);
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

    const { questionId, content, imageUrl } = parsed.data;
    const [role, question] = await Promise.all([
      getUserRole(auth.userId),
      prisma.question.findUnique({
        where: { id: questionId },
        select: {
          id: true,
          lessonId: true,
        },
      }),
    ]);

    if (!question) {
      return NextResponse.json(
        { error: "კითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    const access = await getEnrollmentAccessForLesson(auth.userId, question.lessonId);

    if (!access) {
      return NextResponse.json(
        { error: "გაკვეთილი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    const isAdmin = role === "ADMIN";

    if (!isAdmin && !access.enrolled) {
      return NextResponse.json(
        { error: "პასუხის გაცემა მხოლოდ ჩაწერილ სტუდენტებს შეუძლიათ" },
        { status: 403 }
      );
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        imageUrl,
        questionId,
        userId: auth.userId,
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
    console.error("POST /api/answers failed", error);
    return NextResponse.json(
      { error: "პასუხის დამატება ვერ მოხერხდა, სცადეთ თავიდან" },
      { status: 500 }
    );
  }
}
