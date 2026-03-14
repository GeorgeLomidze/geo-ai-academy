import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
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
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const result = createLessonSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "title")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { title, moduleId, type, content, bunnyVideoId, duration, isFree } =
      result.data;

    const mod = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) {
      return notFoundResponse();
    }

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
  } catch (error) {
    return handleApiError(error, "POST /api/admin/lessons failed");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const result = updateLessonSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "id")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { id, ...data } = result.data;
    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      return notFoundResponse();
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data,
    });

    return NextResponse.json(lesson);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/lessons failed");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const result = deleteLessonSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "id")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const existing = await prisma.lesson.findUnique({
      where: { id: result.data.id },
    });
    if (!existing) {
      return notFoundResponse();
    }

    await prisma.lesson.delete({ where: { id: result.data.id } });

    return NextResponse.json({ message: "გაკვეთილი წარმატებით წაიშალა" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/lessons failed");
  }
}
