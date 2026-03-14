import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  code?: string;
  fullHeight?: boolean;
  className?: string;
};

export function ErrorState({
  title,
  description,
  actions,
  code,
  fullHeight = false,
  className,
}: ErrorStateProps) {
  return (
    <section
      className={cn(
        "flex items-center justify-center bg-brand-background px-4 py-10 sm:px-6 sm:py-14",
        fullHeight ? "min-h-dvh" : "min-h-[28rem]",
        className
      )}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-brand-border bg-brand-surface shadow-sm">
        <div className="border-b border-brand-border px-5 py-4 sm:px-6">
          <span className="inline-flex rounded-full border border-brand-primary/30 bg-brand-primary-light px-3 py-1 text-xs font-medium text-brand-primary">
            GEO AI Academy
          </span>
        </div>

        <div className="px-6 py-10 text-center sm:px-10 sm:py-14">
          {code ? (
            <p className="font-display text-6xl font-bold tabular-nums text-brand-primary sm:text-7xl">
              {code}
            </p>
          ) : (
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-primary-light text-3xl font-bold text-brand-primary">
              !
            </div>
          )}

          <h1 className="mt-6 text-balance font-display text-2xl font-bold text-brand-secondary sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-pretty text-base leading-7 text-brand-muted">
            {description}
          </p>

          {actions ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
