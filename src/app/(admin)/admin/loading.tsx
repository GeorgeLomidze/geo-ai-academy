function AdminCardSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="size-10 animate-pulse rounded-xl bg-brand-surface-light" />
        <div className="h-4 w-14 animate-pulse rounded bg-brand-surface-light" />
      </div>
      <div className="mt-4 h-8 w-28 animate-pulse rounded bg-brand-surface-light" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-brand-surface-light" />
      <div className="mt-2 h-4 w-40 animate-pulse rounded bg-brand-surface-light" />
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-40 animate-pulse rounded bg-brand-surface-light" />
        <div className="h-5 w-52 animate-pulse rounded bg-brand-surface-light" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCardSkeleton />
        <AdminCardSkeleton />
        <AdminCardSkeleton />
        <AdminCardSkeleton />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 lg:col-span-3">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-brand-surface-light" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-28 animate-pulse rounded-xl bg-brand-background" />
              <div className="h-28 animate-pulse rounded-xl bg-brand-background" />
              <div className="h-28 animate-pulse rounded-xl bg-brand-background" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 lg:col-span-2">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-16 animate-pulse rounded-xl bg-brand-background" />
            <div className="h-16 animate-pulse rounded-xl bg-brand-background" />
            <div className="h-16 animate-pulse rounded-xl bg-brand-background" />
          </div>
        </div>
      </div>
    </div>
  );
}
