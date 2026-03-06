import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const enrollSchema = z.object({
  courseId: z.string().uuid("არასწორი კურსის ID"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "არასწორი მოთხოვნა" },
        { status: 400 }
      );
    }

    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "არასწორი მონაცემები" },
        { status: 400 }
      );
    }

    const { courseId } = parsed.data;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "კურსი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "ეს კურსი ამჟამად მიუწვდომელია" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "თქვენ უკვე ჩაწერილი ხართ ამ კურსზე" },
        { status: 409 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: auth.userId,
        courseId,
      },
    });

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/enroll failed", error);
    return NextResponse.json(
      { error: "ჩაწერა ვერ მოხერხდა, სცადეთ თავიდან" },
      { status: 500 }
    );
  }
}
