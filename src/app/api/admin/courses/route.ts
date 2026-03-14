import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/slugify";

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

const createCourseSchema = z.object({
  title: z.string().min(1, "კურსის სახელი აუცილებელია"),
  description: z.string().min(1, "კურსის აღწერა აუცილებელია"),
  shortDescription: z.string().optional(),
  thumbnailUrl: z
    .string()
    .refine(isValidThumbnailUrl, "არასწორი ბმული")
    .optional(),
  price: z.number().int().min(0, "ფასი არ შეიძლება იყოს უარყოფითი").default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const courses = await prisma.course.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            modules: true,
          },
        },
        modules: {
          include: {
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    const result = courses.map((course) => ({
      ...course,
      modulesCount: course._count.modules,
      lessonsCount: course.modules.reduce((sum, m) => sum + m._count.lessons, 0),
      modules: undefined,
      _count: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/courses failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const result = createCourseSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "title")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { title, description, shortDescription, thumbnailUrl, price, status } =
      result.data;

    let slug = slugify(title);
    if (!slug) {
      slug = `course-${Date.now()}`;
    }

    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const maxSort = await prisma.course.aggregate({ _max: { sortOrder: true } });
    const nextSortOrder = (maxSort._max.sortOrder ?? 0) + 1;

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        thumbnailUrl,
        price,
        status,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/courses failed");
  }
}
