export default function CourseDetailLoading() {
  return (
    <div className="bg-brand-background">
      <section className="bg-[linear-gradient(180deg,#0A0A0A_0%,#171400_50%,#0A0A0A_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
            <div className="space-y-5">
              <div className="h-12 w-3/4 animate-pulse rounded bg-brand-surface-light" />
              <div className="h-6 w-full animate-pulse rounded bg-brand-surface-light/80" />
              <div className="h-6 w-5/6 animate-pulse rounded bg-brand-surface-light/80" />
              <div className="flex gap-4 pt-4">
                <div className="h-12 w-40 animate-pulse rounded-xl bg-brand-surface-light" />
                <div className="h-12 w-24 animate-pulse rounded-xl bg-brand-surface-light/80" />
              </div>
            </div>

            <div className="hidden aspect-[4/3] animate-pulse rounded-2xl bg-brand-surface-light/80 lg:block" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-5 w-full animate-pulse rounded bg-brand-surface-light" />
            <div className="h-5 w-11/12 animate-pulse rounded bg-brand-surface-light" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-brand-surface-light" />

            <div className="space-y-3 pt-4">
              <div className="h-20 animate-pulse rounded-2xl bg-brand-surface-light" />
              <div className="h-20 animate-pulse rounded-2xl bg-brand-surface-light" />
              <div className="h-20 animate-pulse rounded-2xl bg-brand-surface-light" />
            </div>
          </div>

          <div className="h-96 animate-pulse rounded-2xl bg-brand-surface-light" />
        </div>
      </section>
    </div>
  );
}
