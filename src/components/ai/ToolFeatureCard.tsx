import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToolFeatureCardProps = {
  title: string;
  href: string;
  ctaLabel: string;
  icon: LucideIcon;
  iconTone?: string;
  available?: boolean;
  badge?: string;
  animationDelayMs?: number;
  className?: string;
};

export function ToolFeatureCard({
  title,
  href,
  ctaLabel,
  icon: Icon,
  iconTone = "text-brand-primary",
  available = true,
  badge,
  animationDelayMs = 0,
  className,
}: ToolFeatureCardProps) {
  return (
    <section
      className={cn(
        "group relative min-h-[220px] overflow-hidden rounded-[26px] border border-brand-border bg-brand-surface/95 p-4 text-left shadow-sm animate-in fade-in-0 zoom-in-95 duration-500 sm:min-h-[238px] sm:p-5",
        className,
      )}
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute inset-x-4 top-0 h-px bg-brand-primary/35" />
        <div className="absolute -right-16 top-8 h-14 w-36 rotate-[-18deg] bg-brand-primary/10 blur-2xl" />
        <div className="absolute inset-x-8 bottom-0 h-16 bg-brand-primary/8 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-[1px] rounded-[25px] border border-white/4 opacity-70" />

      {badge ? (
        <span className="absolute right-4 top-4 rounded-full border border-brand-primary/20 bg-brand-primary-light px-3 py-1 text-xs text-brand-primary">
          {badge}
        </span>
      ) : null}

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-background/60 px-3 py-1 text-[11px] text-brand-muted">
            <Sparkles className="size-3.5 text-brand-primary" />
            AI Tool
          </div>
        </div>

        <div className="mt-4 flex size-12 items-center justify-center rounded-2xl border border-brand-primary/15 bg-brand-background/80 shadow-sm transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105">
          <Icon
            className={cn(
              "size-6 transition-transform duration-200 group-hover:scale-110",
              iconTone,
            )}
            aria-hidden="true"
          />
        </div>

        <div className="mt-5 max-w-[17rem]">
          <h2 className="text-balance text-[1.7rem] leading-none text-brand-secondary sm:text-[1.95rem]">
            {title}
          </h2>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="h-px flex-1 bg-brand-border transition-colors duration-200 group-hover:bg-brand-primary/25" />
          <Button
            asChild
            size="sm"
            variant={available ? "default" : "outline"}
            className={cn(
              "rounded-full px-4.5 transition-transform duration-200 group-hover:-translate-y-0.5",
              available
                ? "bg-brand-accent text-black hover:bg-brand-accent-hover"
                : "border-brand-border bg-transparent text-brand-secondary hover:border-brand-primary/30 hover:bg-brand-primary-light",
            )}
          >
            <Link href={href}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
