import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const createLessonSchema = z
  .object({
    title: z.string().min(1, "გაკვეთილის სახელი აუცილებელია"),
    moduleId: z.string().uuid("არასწორი მოდულის ID"),
    type: z.enum(["VIDEO", "TEXT"]).default("VIDEO"),
    content: z.string().optional(),
    bunnyVideoId: z.string().optional(),
    duration: z.number().int().min(0).default(0),
    isFree: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.type === "VIDEO") return !!data.bunnyVideoId;
      if (data.type === "TEXT") return !!data.content;
      return true;
    },
    {
      message: "ვიდეო გაკვეთილისთვის საჭიროა ვიდეოს ID, ტექსტურისთვის - შინაარსი",
    }
  );

const updateLessonSchema = z.object({
  id: z.string().uuid("არასწორი გაკვეთილის ID"),
  title: z.string().min(1, "გაკვეთილის სახელი აუცილებელია").optional(),
  type: z.enum(["VIDEO", "TEXT"]).optional(),
  content: z.string().nullable().optional(),
  bunnyVideoId: z.string().nullable().optional(),
  duration: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const deleteLessonSchema = z.object({
  id: z.string().uuid("არასწორი გაკვეთილის ID"),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const result = createLessonSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const { title, moduleId, type, content, bunnyVideoId, duration, isFree } =
    result.data;

  // Verify module exists
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) {
    return NextResponse.json(
      { error: "მოდული ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  // Get next sortOrder within the module
  const maxSort = await prisma.lesson.aggregate({
    where: { moduleId },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (maxSort._max.sortOrder ?? 0) + 1;

  const lesson = await prisma.lesson.create({
    data: {
      title,
      moduleId,
      type,
      content: content ?? null,
      bunnyVideoId: bunnyVideoId ?? null,
      duration,
      isFree,
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const result = updateLessonSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const { id, ...data } = result.data;

  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "გაკვეთილი ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  const lesson = await prisma.lesson.update({
    where: { id },
    data,
  });

  return NextResponse.json(lesson);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const result = deleteLessonSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const existing = await prisma.lesson.findUnique({
    where: { id: result.data.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "გაკვეთილი ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  await prisma.lesson.delete({ where: { id: result.data.id } });

  return NextResponse.json({ message: "გაკვეთილი წარმატებით წაიშალა" });
}
