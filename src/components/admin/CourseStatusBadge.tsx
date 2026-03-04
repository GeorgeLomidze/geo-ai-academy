import { cn } from "@/lib/utils";

const statusConfig = {
  DRAFT: { label: "დრაფტი", className: "bg-amber-100 text-amber-700" },
  PUBLISHED: { label: "გამოქვეყნებული", className: "bg-emerald-100 text-emerald-700" },
  ARCHIVED: { label: "დაარქივებული", className: "bg-gray-100 text-gray-600" },
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
