import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const updateCourseSchema = z.object({
  title: z.string().min(1, "კურსის სახელი აუცილებელია").optional(),
  description: z.string().optional(),
  shortDescription: z.string().nullable().optional(),
  thumbnailUrl: z.string().url("არასწორი ბმული").nullable().optional(),
  price: z.number().int().min(0, "ფასი არ შეიძლება იყოს უარყოფითი").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

type RouteParams = { params: Promise<{ courseId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json(
      { error: "კურსი ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  return NextResponse.json(course);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { courseId } = await params;

  const body = await request.json().catch(() => null);
  const result = updateCourseSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) {
    return NextResponse.json(
      { error: "კურსი ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data: result.data,
  });

  return NextResponse.json(course);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { courseId } = await params;

  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) {
    return NextResponse.json(
      { error: "კურსი ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  // Cascade delete is configured in Prisma schema (modules → lessons)
  await prisma.course.delete({ where: { id: courseId } });

  return NextResponse.json({ message: "კურსი წარმატებით წაიშალა" });
}
