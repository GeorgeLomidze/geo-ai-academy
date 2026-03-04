import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
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

const deleteModuleSchema = z.object({
  id: z.string().uuid("არასწორი მოდულის ID"),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const result = createModuleSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const { title, courseId } = result.data;

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json(
      { error: "კურსი ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  // Get next sortOrder within the course
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
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const result = reorderModulesSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  // Update all modules in a transaction
  await prisma.$transaction(
    result.data.modules.map(({ id, sortOrder }) =>
      prisma.module.update({
        where: { id },
        data: { sortOrder },
      })
    )
  );

  return NextResponse.json({ message: "თანმიმდევრობა განახლდა" });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const result = deleteModuleSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  const existing = await prisma.module.findUnique({
    where: { id: result.data.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "მოდული ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  // Cascade delete is configured in Prisma schema (lessons)
  await prisma.module.delete({ where: { id: result.data.id } });

  return NextResponse.json({ message: "მოდული წარმატებით წაიშალა" });
}
