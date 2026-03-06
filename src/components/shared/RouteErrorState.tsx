"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type RouteErrorStateProps = {
  title: string;
  description: string;
  reset: () => void;
};

export function RouteErrorState({
  title,
  description,
  reset,
}: RouteErrorStateProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="rounded-3xl border border-brand-border bg-brand-surface p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-danger/10">
          <AlertCircle className="size-8 text-brand-danger" />
        </div>
        <h1 className="mt-6 text-balance font-display text-2xl font-bold text-brand-secondary">
          {title}
        </h1>
        <p className="mt-3 text-pretty text-base leading-7 text-brand-muted">
          {description}
        </p>
        <Button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-brand-primary text-black hover:bg-brand-primary-hover"
        >
          <RefreshCcw className="size-4" />
          ხელახლა ცდა
        </Button>
      </div>
    </div>
  );
}
