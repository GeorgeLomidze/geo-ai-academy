export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-40 animate-pulse rounded bg-brand-surface-light" />
          <div className="h-5 w-64 animate-pulse rounded bg-brand-surface-light" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-xl bg-brand-surface-light" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl border border-brand-border bg-brand-surface"
          />
        ))}
      </div>
    </div>
  );
}
