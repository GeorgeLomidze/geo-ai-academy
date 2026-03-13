"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type NotificationDropdownItem = {
  id: string;
  title: string;
  description: string;
  meta?: string;
  href: string;
  isRead: boolean;
  createdAt: string;
};

interface NotificationDropdownSectionProps {
  title?: string;
  unreadCount: number;
  items: NotificationDropdownItem[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyDescription: string;
  onSelectItem: (item: NotificationDropdownItem) => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdownSection({
  title = "შეტყობინებები",
  unreadCount,
  items,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  onSelectItem,
  onMarkAllRead,
}: NotificationDropdownSectionProps) {
  return (
    <>
      <DropdownMenuLabel className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-secondary">{title}</p>
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
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-brand-secondary">{emptyTitle}</p>
            <p className="mt-2 text-sm text-brand-muted">{emptyDescription}</p>
          </div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="cursor-pointer rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
              onSelect={() => onSelectItem(item)}
            >
              <div className="flex w-full items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.isRead ? "bg-brand-border" : "bg-brand-danger"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-semibold text-brand-secondary">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-xs text-brand-muted">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-brand-muted">
                    {item.description}
                  </p>
                  {item.meta ? (
                    <p className="mt-2 text-xs text-brand-muted/80">{item.meta}</p>
                  ) : null}
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
          onClick={onMarkAllRead}
          disabled={loading || unreadCount === 0}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
          ყველას წაკითხულად მონიშვნა
        </Button>
      </div>
    </>
  );
}
