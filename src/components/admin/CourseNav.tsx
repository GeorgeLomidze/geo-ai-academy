"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "რედაქტირება", href: "" },
  { label: "მოდულები", href: "/modules" },
  { label: "პარამეტრები", href: "/settings" },
] as const;

export function CourseNav({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const base = `/admin/courses/${courseId}`;

  return (
    <nav className="flex gap-1 rounded-xl border border-brand-border bg-brand-surface p-1">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive =
          tab.href === ""
            ? pathname === base
            : pathname.startsWith(href);

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-primary text-black"
                : "text-brand-muted hover:bg-brand-primary-light hover:text-brand-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
