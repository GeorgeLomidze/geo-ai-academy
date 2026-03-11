"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Star,
  MessageSquareText,
  Users,
  Mail,
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
  ShoppingCart,
  Star,
  MessageSquareText,
  Users,
  Mail,
  Settings,
} as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [qaUnreadCount, setQaUnreadCount] = useState(0);

  useEffect(() => {
    async function refreshNotifications() {
      try {
        const response = await fetch("/api/admin/notifications", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { unreadCount?: number };
        setQaUnreadCount(data.unreadCount ?? 0);
      } catch {
        // Silent failure: the sidebar should remain usable without notifications.
      }
    }

    void refreshNotifications();

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30000);

    const handleFocus = () => {
      void refreshNotifications();
    };

    const handleSync = () => {
      void refreshNotifications();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("qa:notifications-sync", handleSync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("qa:notifications-sync", handleSync);
    };
  }, []);

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
            const hasUnreadQA = item.href === "/admin/qa" && qaUnreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "font-nav relative flex items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-brand-primary bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-brand-muted hover:bg-sidebar-accent hover:text-brand-secondary"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && (
                  <span>{item.label}</span>
                )}
                {hasUnreadQA ? (
                  <>
                    <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-emerald-400" />
                    <span className="absolute right-2.5 top-2.5 size-2 animate-ping rounded-full bg-emerald-400/70" />
                  </>
                ) : null}
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
          const hasUnreadQA = item.href === "/admin/qa" && qaUnreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-nav relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-brand-primary"
                  : "text-brand-muted hover:text-brand-primary"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
              {hasUnreadQA ? (
                <>
                  <span className="absolute right-3 top-2 size-2 rounded-full bg-emerald-400" />
                  <span className="absolute right-3 top-2 size-2 animate-ping rounded-full bg-emerald-400/70" />
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
