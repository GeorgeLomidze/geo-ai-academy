function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <div className="aspect-[16/9] animate-pulse bg-brand-surface-light" />
      <div className="space-y-4 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded bg-brand-surface-light" />
        <div className="h-4 w-full animate-pulse rounded bg-brand-surface-light" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-brand-surface-light" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-5 w-20 animate-pulse rounded bg-brand-surface-light" />
          <div className="h-9 w-24 animate-pulse rounded-xl bg-brand-surface-light" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="max-w-2xl space-y-3">
        <div className="h-10 w-72 animate-pulse rounded bg-brand-surface-light" />
        <div className="h-5 w-full animate-pulse rounded bg-brand-surface-light" />
        <div className="h-5 w-5/6 animate-pulse rounded bg-brand-surface-light" />
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <CourseCardSkeleton />
        <CourseCardSkeleton />
        <CourseCardSkeleton />
      </div>
    </div>
  );
}
