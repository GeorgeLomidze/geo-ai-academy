export default function AdminCoursesLoading() {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded bg-brand-surface-light" />
          <div className="h-4 w-56 animate-pulse rounded bg-brand-surface-light" />
        </div>
        <div className="h-10 w-44 animate-pulse rounded-xl bg-brand-surface-light" />
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-4">
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-4 border-b border-brand-border pb-3">
            <div className="h-4 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-4 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-4 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-4 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-4 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-4 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-4 animate-pulse rounded bg-brand-surface-light" />
          </div>

          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-7 items-center gap-4 border-b border-brand-border py-4 last:border-b-0"
            >
              <div className="size-10 animate-pulse rounded-lg bg-brand-surface-light" />
              <div className="space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-brand-surface-light" />
                <div className="h-3 w-24 animate-pulse rounded bg-brand-surface-light" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-brand-surface-light" />
              <div className="h-4 w-8 animate-pulse rounded bg-brand-surface-light" />
              <div className="h-4 w-8 animate-pulse rounded bg-brand-surface-light" />
              <div className="h-4 w-16 animate-pulse rounded bg-brand-surface-light" />
              <div className="flex gap-2">
                <div className="size-8 animate-pulse rounded-lg bg-brand-surface-light" />
                <div className="size-8 animate-pulse rounded-lg bg-brand-surface-light" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
