export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/CourseForm";
import { CourseNav } from "@/components/admin/CourseNav";

type Props = { params: Promise<{ courseId: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        {course.title}
      </h1>
      <p className="mt-1 text-sm text-brand-muted">კურსის რედაქტირება</p>

      <div className="mt-4">
        <CourseNav courseId={courseId} />
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <CourseForm
          course={{
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            shortDescription: course.shortDescription,
            thumbnailUrl: course.thumbnailUrl,
            price: course.price,
          }}
        />
      </div>
    </div>
  );
}
