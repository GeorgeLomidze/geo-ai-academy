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

function isValidThumbnailUrl(value: string) {
  if (value.startsWith("/")) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const updateCourseSchema = z.object({
  title: z.string().min(1, "კურსის სახელი აუცილებელია").optional(),
  description: z.string().optional(),
  shortDescription: z.string().nullable().optional(),
  thumbnailUrl: z
    .string()
    .refine(isValidThumbnailUrl, "არასწორი ბმული")
    .nullable()
    .optional(),
  price: z.number().int().min(0, "ფასი არ შეიძლება იყოს უარყოფითი").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

type RouteParams = { params: Promise<{ courseId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin(request);
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
      return notFoundResponse();
    }

    return NextResponse.json(course);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/courses/[courseId] failed");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { courseId } = await params;

    const body = await parseJsonBody(request);
    const result = updateCourseSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "title")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) {
      return notFoundResponse();
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: result.data,
    });

    return NextResponse.json(course);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/courses/[courseId] failed");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { courseId } = await params;

    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) {
      return notFoundResponse();
    }

    await prisma.course.delete({ where: { id: courseId } });

    return NextResponse.json({ message: "კურსი წარმატებით წაიშალა" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/courses/[courseId] failed");
  }
}
