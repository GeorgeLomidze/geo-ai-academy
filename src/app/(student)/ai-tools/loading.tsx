function ToolCardSkeleton() {
  return (
    <div className="min-h-[220px] overflow-hidden rounded-[26px] border border-brand-border bg-brand-surface/95 p-5 sm:min-h-[238px]">
      <div className="flex h-full flex-col">
        <div className="h-7 w-20 animate-pulse rounded-full bg-brand-surface-light" />
        <div className="mt-4 size-12 animate-pulse rounded-2xl bg-brand-surface-light" />
        <div className="mt-5 space-y-2">
          <div className="h-8 w-3/4 animate-pulse rounded bg-brand-surface-light" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="h-px flex-1 bg-brand-border" />
          <div className="h-9 w-36 animate-pulse rounded-full bg-brand-surface-light" />
        </div>
      </div>
    </div>
  );
}

export default function AIToolsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-48 animate-pulse rounded bg-brand-surface-light" />
        <div className="h-5 w-64 animate-pulse rounded bg-brand-surface-light" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ToolCardSkeleton />
        <ToolCardSkeleton />
        <ToolCardSkeleton />
        <ToolCardSkeleton />
      </div>
    </div>
  );
}
