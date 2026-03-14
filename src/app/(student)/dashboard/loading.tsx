function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
      <div className="flex items-center gap-4">
        <div className="size-12 animate-pulse rounded-xl bg-brand-surface-light" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-20 animate-pulse rounded bg-brand-surface-light" />
          <div className="h-4 w-32 animate-pulse rounded bg-brand-surface-light" />
        </div>
      </div>
    </div>
  );
}

function CourseSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <div className="aspect-[16/9] animate-pulse bg-brand-surface-light" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-brand-surface-light" />
        <div className="h-4 w-full animate-pulse rounded bg-brand-surface-light" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-brand-surface-light" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-56 animate-pulse rounded bg-brand-surface-light" />
        <div className="h-5 w-72 animate-pulse rounded bg-brand-surface-light" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      <div className="space-y-4">
        <div className="h-7 w-40 animate-pulse rounded bg-brand-surface-light" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CourseSkeleton />
          <CourseSkeleton />
          <CourseSkeleton />
        </div>
      </div>
    </div>
  );
}
