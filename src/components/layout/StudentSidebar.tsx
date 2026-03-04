"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const studentNavItems = [
  { label: "სამუშაო პანელი", href: "/dashboard", icon: LayoutDashboard },
  { label: "ჩემი კურსები", href: "/courses", icon: BookOpen },
  { label: "პროფილი", href: "/profile", icon: User },
] as const;

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-brand-border bg-brand-surface lg:block">
      <nav className="space-y-1 px-3 py-4">
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-primary-light text-brand-primary"
                  : "text-brand-muted hover:bg-gray-100 hover:text-brand-secondary"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
