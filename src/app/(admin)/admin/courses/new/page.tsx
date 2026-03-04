import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/CourseForm";

export default function NewCoursePage() {
  return (
    <div>
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="size-4" />
        კურსებზე დაბრუნება
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-brand-secondary">
        ახალი კურსის შექმნა
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        შეავსეთ კურსის ძირითადი ინფორმაცია
      </p>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <CourseForm />
      </div>
    </div>
  );
}
