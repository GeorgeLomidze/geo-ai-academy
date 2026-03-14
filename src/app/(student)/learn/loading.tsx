export default function LearnSegmentLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="h-9 w-40 animate-pulse rounded bg-brand-surface-light" />
        <div className="rounded-3xl border border-brand-border bg-brand-surface p-6">
          <div className="space-y-4">
            <div className="h-5 w-28 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-10 w-2/3 animate-pulse rounded bg-brand-surface-light" />
            <div className="aspect-video animate-pulse rounded-[28px] bg-brand-surface-light" />
          </div>
        </div>
        <div className="rounded-3xl border border-brand-border bg-brand-surface p-6">
          <div className="space-y-3">
            <div className="h-6 w-32 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-24 animate-pulse rounded-2xl bg-brand-surface-light" />
            <div className="h-24 animate-pulse rounded-2xl bg-brand-surface-light" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-brand-border bg-brand-surface p-5">
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-brand-surface-light" />
          <div className="h-3 w-full animate-pulse rounded-full bg-brand-surface-light" />
          <div className="h-20 animate-pulse rounded-2xl bg-brand-surface-light" />
          <div className="h-20 animate-pulse rounded-2xl bg-brand-surface-light" />
        </div>
      </div>
    </div>
  );
}
