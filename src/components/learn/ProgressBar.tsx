"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  size?: "sm" | "md";
};

export function ProgressBar({
  value,
  label,
  className,
  trackClassName,
  barClassName,
  size = "md",
}: ProgressBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, Math.round(value)));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setDisplayValue(normalizedValue);
  }, [normalizedValue]);

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-brand-muted">{label}</span>
          <span className="tabular-nums font-medium text-brand-secondary">
            {normalizedValue}%
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-full bg-brand-border",
          size === "sm" ? "h-2" : "h-3",
          trackClassName
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
        aria-label={label ?? "პროგრესის ზოლი"}
      >
        <div
          className={cn(
            "h-full origin-left rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-transform duration-200 ease-out motion-reduce:transition-none",
            barClassName
          )}
          style={{ transform: `scaleX(${displayValue / 100})` }}
        />
      </div>
    </div>
  );
}
