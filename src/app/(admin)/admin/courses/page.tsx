export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, BookOpen, Pencil, Trash2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CourseStatusBadge } from "@/components/admin/CourseStatusBadge";
import { prisma } from "@/lib/prisma";
import { DeleteCourseButton } from "./delete-button";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { modules: true },
      },
      modules: {
        include: {
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  const enriched = courses.map((course: typeof courses[number]) => ({
    ...course,
    modulesCount: course._count.modules,
    lessonsCount: course.modules.reduce((sum, m) => sum + m._count.lessons, 0),
  }));

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-secondary">
            კურსები
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            მართე კურსები და სასწავლო მასალა
          </p>
        </div>
        <Button asChild className="rounded-xl gap-1.5">
          <Link href="/admin/courses/new">
            <Plus className="size-4" />
            ახალი კურსის დამატება
          </Link>
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        {enriched.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary-light">
              <BookOpen className="size-6 text-brand-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-brand-secondary">
              კურსები ჯერ არ არის დამატებული
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              დაამატეთ პირველი კურსი ზემოთ მოცემული ღილაკით
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-brand-border">
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted">
                  სურათი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted">
                  სახელი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted">
                  სტატუსი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted">
                  მოდულები
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted">
                  გაკვეთილები
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted">
                  ფასი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted">
                  მოქმედება
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enriched.map((course) => (
                <TableRow key={course.id} className="border-brand-border">
                  <TableCell className="px-4">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        className="size-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-light">
                        <Image className="size-4 text-brand-primary" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <div>
                      <p className="font-medium text-brand-secondary">
                        {course.title}
                      </p>
                      <p className="text-xs text-brand-muted">
                        /{course.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <CourseStatusBadge status={course.status} />
                  </TableCell>
                  <TableCell className="px-4 text-brand-secondary">
                    {course.modulesCount}
                  </TableCell>
                  <TableCell className="px-4 text-brand-secondary">
                    {course.lessonsCount}
                  </TableCell>
                  <TableCell className="px-4 text-brand-secondary">
                    {course.price === 0 ? (
                      <span className="text-brand-muted">უფასო</span>
                    ) : (
                      `${course.price} ₾`
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="size-8 rounded-lg p-0"
                      >
                        <Link href={`/admin/courses/${course.id}`}>
                          <Pencil className="size-3.5" />
                          <span className="sr-only">რედაქტირება</span>
                        </Link>
                      </Button>
                      <DeleteCourseButton
                        courseId={course.id}
                        courseTitle={course.title}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
