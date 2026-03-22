export default function ImageGeneratorLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-52 animate-pulse rounded bg-brand-surface-light" />
        <div className="h-5 w-80 animate-pulse rounded bg-brand-surface-light" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-brand-surface-light" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-brand-surface-light" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 animate-pulse rounded-lg bg-brand-surface-light" />
            <div className="h-10 animate-pulse rounded-lg bg-brand-surface-light" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-2xl bg-brand-surface-light" />
        </div>
        <div className="aspect-square animate-pulse rounded-2xl border border-brand-border bg-brand-surface" />
      </div>
    </div>
  );
}
