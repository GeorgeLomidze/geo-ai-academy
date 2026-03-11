"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { SerializedAdminNotification } from "@/lib/qa";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationBellProps {
  initialNotifications: SerializedAdminNotification[];
  initialUnreadCount: number;
}

type NotificationResponse = {
  notifications: SerializedAdminNotification[];
  unreadCount: number;
  error?: string;
};

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshNotifications(silent = false) {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });

      const data = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        setError(data.error ?? "შეტყობინებების ჩატვირთვა ვერ მოხერხდა");
        return;
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshNotifications(true);
    }, 30000);

    const handleFocus = () => {
      void refreshNotifications(true);
    };

    const handleSync = () => {
      void refreshNotifications(true);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("qa:notifications-sync", handleSync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("qa:notifications-sync", handleSync);
    };
  }, []);

  async function handleNotificationClick(notification: SerializedAdminNotification) {
    try {
      setError(null);
      router.push(notification.linkUrl ?? "/admin/qa");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "შეტყობინების განახლება ვერ მოხერხდა"
      );
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllRead: true }),
      });

      const data = (await response.json()) as NotificationResponse & { error?: string };

      if (!response.ok) {
        setError(data.error ?? "შეტყობინებების განახლება ვერ მოხერხდა");
        return;
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      window.dispatchEvent(new Event("qa:notifications-sync"));
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => (open ? void refreshNotifications() : undefined)}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-brand-muted hover:bg-brand-surface"
          aria-label="შეტყობინებები"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <>
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-danger" />
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-danger px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[360px] rounded-2xl border-white/10 bg-[#111111] p-2 text-brand-secondary shadow-2xl"
      >
        <DropdownMenuLabel className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-secondary">
                ახალი შეტყობინებები
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                {unreadCount > 0
                  ? `${unreadCount} წაუკითხავი შეტყობინება`
                  : "ყველა შეტყობინება წაკითხულია"}
              </p>
            </div>
            {loading ? <Loader2 className="size-4 animate-spin text-brand-muted" /> : null}
          </div>
        </DropdownMenuLabel>

        {error ? (
          <div className="px-3 py-3 text-sm text-brand-danger">{error}</div>
        ) : null}

        <div className="max-h-96 overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-brand-secondary">
                ახალი შეტყობინებები არ არის
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                ახალი კითხვები და აქტივობა აქ გამოჩნდება.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={(event) => event.preventDefault()}
                className="cursor-pointer rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
                onClick={() => void handleNotificationClick(notification)}
              >
                <div className="flex w-full items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      notification.isRead ? "bg-brand-border" : "bg-brand-danger"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-1 text-sm font-semibold text-brand-secondary">
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-xs text-brand-muted">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-brand-muted">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => void handleMarkAllRead()}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
            ყველას წაკითხულად მონიშვნა
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
