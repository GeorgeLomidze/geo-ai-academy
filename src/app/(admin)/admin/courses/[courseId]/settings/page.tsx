export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourseNav } from "@/components/admin/CourseNav";
import { CourseSettings } from "@/components/admin/CourseSettings";

type Props = { params: Promise<{ courseId: string }> };

export default async function CourseSettingsPage({ params }: Props) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!course) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        {course.title}
      </h1>
      <p className="mt-1 text-sm text-brand-muted">კურსის პარამეტრები</p>

      <div className="mt-4">
        <CourseNav courseId={courseId} />
      </div>

      <div className="mt-6">
        <CourseSettings course={course} />
      </div>
    </div>
  );
}
