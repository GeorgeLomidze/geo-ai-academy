import { cn } from "@/lib/utils";

const statusConfig = {
  DRAFT: { label: "დრაფტი", className: "border border-brand-warning/20 bg-brand-warning/10 text-brand-warning" },
  PUBLISHED: { label: "გამოქვეყნებული", className: "border border-brand-success/20 bg-brand-success/10 text-brand-success" },
  ARCHIVED: { label: "დაარქივებული", className: "border border-brand-border bg-brand-surface-light text-brand-muted" },
} as const;

type CourseStatus = keyof typeof statusConfig;

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
