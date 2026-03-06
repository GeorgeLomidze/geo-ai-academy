export default function LearnLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="flex gap-3">
          <div className="h-9 w-36 animate-pulse rounded-xl bg-brand-surface-light" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-brand-surface-light" />
        </div>

        <section className="rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <div className="h-5 w-32 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-5 w-48 animate-pulse rounded bg-brand-surface-light" />
          </div>

          <div className="mt-8 overflow-hidden rounded-[28px] border border-brand-border bg-brand-surface shadow-sm">
            <div className="h-16 animate-pulse border-b border-brand-border bg-brand-surface-light" />
            <div className="aspect-video animate-pulse bg-brand-surface-light" />
            <div className="h-16 animate-pulse border-t border-brand-border bg-brand-surface-light" />
          </div>

          <div className="mt-8 rounded-3xl border border-brand-border bg-brand-background p-5">
            <div className="space-y-3">
              <div className="h-5 w-36 animate-pulse rounded bg-brand-surface-light" />
              <div className="h-6 w-2/3 animate-pulse rounded bg-brand-surface-light" />
              <div className="h-10 w-40 animate-pulse rounded-xl bg-brand-surface-light" />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <div className="space-y-4">
            <div className="h-6 w-40 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-3 w-full animate-pulse rounded-full bg-brand-surface-light" />
            <div className="grid gap-3">
              <div className="h-20 animate-pulse rounded-2xl bg-brand-surface-light" />
              <div className="h-20 animate-pulse rounded-2xl bg-brand-surface-light" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <div className="space-y-3">
            <div className="h-6 w-36 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-24 animate-pulse rounded-2xl bg-brand-surface-light" />
            <div className="h-24 animate-pulse rounded-2xl bg-brand-surface-light" />
            <div className="h-24 animate-pulse rounded-2xl bg-brand-surface-light" />
          </div>
        </div>
      </div>
    </div>
  );
}
