"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Star,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNavItems } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";

const iconMap = {
  LayoutDashboard,
  BookOpen,
  Star,
  Users,
  Settings,
} as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "gap-2 px-3"
          )}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <BrandLogo className="w-full" imageClassName="w-full max-w-[190px]" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "border border-white/10 bg-white/5 text-brand-secondary shadow-sm transition-colors duration-200 hover:border-brand-primary/30 hover:bg-sidebar-accent hover:text-brand-secondary",
              collapsed && "size-9"
            )}
            aria-label={collapsed ? "გვერდითი პანელის გახსნა" : "გვერდითი პანელის დახურვა"}
          >
            {collapsed ? (
              <PanelLeft className="size-4.5 text-brand-primary" />
            ) : (
              <PanelLeftClose className="size-4.5 text-brand-primary" />
            )}
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="ადმინის ნავიგაცია">
          {adminNavItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-brand-primary bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-brand-muted hover:bg-sidebar-accent hover:text-brand-secondary"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full border-t border-brand-border bg-brand-background lg:hidden" aria-label="ადმინის ნავიგაცია">
        {adminNavItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
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
