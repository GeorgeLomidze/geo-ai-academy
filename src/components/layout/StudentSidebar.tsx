"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const studentNavItems = [
  { label: "სამუშაო პანელი", href: "/dashboard", icon: LayoutDashboard },
  { label: "ჩემი კურსები", href: "/my-courses", icon: BookOpen },
  { label: "პროფილი", href: "/profile", icon: User },
] as const;

export function StudentSidebar() {
  const pathname = usePathname();
  const isLearnPage = pathname.startsWith("/learn/");

  if (isLearnPage) {
    return null;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-brand-border bg-brand-background lg:block">
        <nav className="space-y-1 px-3 py-4" aria-label="სტუდენტის ნავიგაცია">
          {studentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-brand-primary bg-brand-primary-light text-brand-primary"
                    : "text-brand-muted hover:bg-brand-surface hover:text-brand-secondary"
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full border-t border-brand-border bg-brand-background lg:hidden"
        aria-label="სტუდენტის ნავიგაცია"
      >
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-brand-primary"
                  : "text-brand-muted hover:text-brand-primary"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
