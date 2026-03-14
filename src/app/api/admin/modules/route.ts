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

const createModuleSchema = z.object({
  title: z.string().min(1, "მოდულის სახელი აუცილებელია"),
  courseId: z.string().uuid("არასწორი კურსის ID"),
});

const reorderModulesSchema = z.object({
  modules: z.array(
    z.object({
      id: z.string().uuid("არასწორი მოდულის ID"),
      sortOrder: z.number().int().min(0),
    })
  ),
});

const updateModuleSchema = z.object({
  id: z.string().uuid("არასწორი მოდულის ID"),
  title: z.string().min(1, "მოდულის სახელი აუცილებელია"),
});

const deleteModuleSchema = z.object({
  id: z.string().uuid("არასწორი მოდულის ID"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const result = createModuleSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "title")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { title, courseId } = result.data;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return notFoundResponse();
    }

    const maxSort = await prisma.module.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSort._max.sortOrder ?? 0) + 1;

    const mod = await prisma.module.create({
      data: {
        title,
        courseId,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(mod, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/modules failed");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const reorderResult = reorderModulesSchema.safeParse(body);

    if (reorderResult.success) {
      await prisma.$transaction(
        reorderResult.data.modules.map(({ id, sortOrder }) =>
          prisma.module.update({
            where: { id },
            data: { sortOrder },
          })
        )
      );

      return NextResponse.json({ message: "თანმიმდევრობა განახლდა" });
    }

    const updateResult = updateModuleSchema.safeParse(body);
    if (!updateResult.success) {
      return validationErrorResponse({
        [String(updateResult.error.issues[0]?.path[0] ?? "title")]:
          updateResult.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const existing = await prisma.module.findUnique({
      where: { id: updateResult.data.id },
    });
    if (!existing) {
      return notFoundResponse();
    }

    const mod = await prisma.module.update({
      where: { id: updateResult.data.id },
      data: { title: updateResult.data.title },
    });

    return NextResponse.json(mod);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/modules failed");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const result = deleteModuleSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse({
        [String(result.error.issues[0]?.path[0] ?? "id")]:
          result.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const existing = await prisma.module.findUnique({
      where: { id: result.data.id },
    });
    if (!existing) {
      return notFoundResponse();
    }

    await prisma.module.delete({ where: { id: result.data.id } });

    return NextResponse.json({ message: "მოდული წარმატებით წაიშალა" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/modules failed");
  }
}
