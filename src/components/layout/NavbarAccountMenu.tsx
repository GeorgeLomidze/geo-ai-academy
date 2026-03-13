"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { studentNavItems } from "@/lib/constants";
import { NotificationDropdownSection, type NotificationDropdownItem } from "@/components/layout/NotificationDropdownSection";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { UnreadCountBadge } from "@/components/layout/UnreadCountBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarAccountMenuProps {
  displayName: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  isAdmin: boolean;
  notificationEndpoint?: "/api/admin/notifications" | "/api/notifications";
  initialUnreadCount: number;
  initialNotificationItems: NotificationDropdownItem[];
  showNotificationList: boolean;
}

type NotificationResponse = {
  notifications?: Array<{
    id: string;
    linkUrl: string | null;
    isRead: boolean;
    createdAt: string;
    authorName?: string;
    questionPreview?: string;
    contextLabel?: string;
    title?: string;
    message?: string;
  }>;
  unreadCount: number;
  error?: string;
};

function mapNotificationsToItems(
  notifications: NotificationResponse["notifications"]
): NotificationDropdownItem[] {
  return (notifications ?? []).map((notification) => ({
    id: notification.id,
    title: notification.authorName ?? notification.title ?? "შეტყობინება",
    description:
      notification.questionPreview ?? notification.message ?? "ახალი აქტივობა",
    meta: notification.contextLabel,
    href: notification.linkUrl ?? "/dashboard",
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  }));
}

export function NavbarAccountMenu({
  displayName,
  email,
  avatarUrl,
  initials,
  isAdmin,
  notificationEndpoint,
  initialUnreadCount,
  initialNotificationItems,
  showNotificationList,
}: NavbarAccountMenuProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notificationItems, setNotificationItems] = useState(initialNotificationItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseNotifications = Boolean(notificationEndpoint);

  const refreshNotifications = useCallback(async (silent = false) => {
    if (!notificationEndpoint) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch(notificationEndpoint, {
        cache: "no-store",
      });
      const data = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        if (!silent) {
          setError(data.error ?? "შეტყობინებების ჩატვირთვა ვერ მოხერხდა");
        }
        return;
      }

      setUnreadCount(data.unreadCount);
      setNotificationItems(mapNotificationsToItems(data.notifications));
      setError(null);
    } catch {
      if (!silent) {
        setError("კავშირის შეცდომა, სცადეთ თავიდან");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [notificationEndpoint]);

  useEffect(() => {
    if (!notificationEndpoint) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshNotifications(true);
    }, 30000);

    const handleFocus = () => {
      void refreshNotifications(true);
    };
    const handleNotificationsChanged = () => {
      void refreshNotifications(true);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("notifications:changed", handleNotificationsChanged);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("notifications:changed", handleNotificationsChanged);
    };
  }, [notificationEndpoint, refreshNotifications]);

  async function markNotificationRead(id: string) {
    if (!notificationEndpoint) {
      return true;
    }

    try {
      const response = await fetch(notificationEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        setError(data.error ?? "შეტყობინების განახლება ვერ მოხერხდა");
        return false;
      }

      setUnreadCount(data.unreadCount);
      setNotificationItems(mapNotificationsToItems(data.notifications));
      setError(null);
      return true;
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
      return false;
    }
  }

  async function markAllRead() {
    if (!notificationEndpoint) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(notificationEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        setError(data.error ?? "შეტყობინებების განახლება ვერ მოხერხდა");
        return;
      }

      setUnreadCount(data.unreadCount);
      setNotificationItems(mapNotificationsToItems(data.notifications));
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setLoading(false);
    }
  }

  const notificationSection = !showNotificationList || !canUseNotifications ? null : (
    <>
      <NotificationDropdownSection
        unreadCount={unreadCount}
        items={notificationItems}
        loading={loading}
        error={error}
        emptyTitle="ახალი შეტყობინებები არ არის"
        emptyDescription="როცა პასუხს მიიღებ, აქ გამოჩნდება."
        onSelectItem={(item) => {
          void markNotificationRead(item.id).then((success) => {
            if (!success) {
              return;
            }

            router.push(item.href);
          });
        }}
        onMarkAllRead={() => void markAllRead()}
      />
      <DropdownMenuSeparator />
    </>
  );

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && canUseNotifications) {
          void refreshNotifications();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 outline-none ring-offset-2 transition-colors duration-200 hover:border-brand-primary/30 hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-brand-primary">
          <div className="relative">
            <Avatar data-size="lg">
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
              />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <UnreadCountBadge
              count={unreadCount}
              className="absolute -right-1 -top-1 z-10"
            />
          </div>
          <div className="hidden text-left md:block">
            <p className="font-nav max-w-32 truncate text-sm font-medium text-brand-secondary">
              {displayName}
            </p>
            <p className="font-nav max-w-32 truncate text-xs text-brand-muted">
              პროფილი
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-80 rounded-2xl border-white/10 bg-[#111111] p-2 text-brand-secondary shadow-2xl"
      >
        <DropdownMenuLabel className="rounded-xl border border-white/10 bg-white/[0.03] p-4 font-normal">
          <div className="flex items-start gap-3">
            <Avatar data-size="lg">
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
              />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-secondary">
                {displayName}
              </p>
              <p className="truncate text-xs text-brand-muted">{email}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary-light px-3 py-1 text-xs font-medium text-brand-primary">
                <Sparkles className="size-3.5" />
                {isAdmin ? "ადმინის წვდომა" : "სტუდენტის ანგარიში"}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        {notificationSection}

        <DropdownMenuItem asChild>
          <Link
            href={studentNavItems[0].href}
            className="rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
          >
            <LayoutDashboard />
            {studentNavItems[0].label}
            <ChevronRight className="ml-auto size-4 text-brand-muted" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={studentNavItems[1].href}
            className="rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
          >
            <BookOpen />
            {studentNavItems[1].label}
            <ChevronRight className="ml-auto size-4 text-brand-muted" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={studentNavItems[2].href}
            className="rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
          >
            <User />
            {studentNavItems[2].label}
            <ChevronRight className="ml-auto size-4 text-brand-muted" />
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
            >
              <Shield />
              ადმინის პანელი
              <ChevronRight className="ml-auto size-4 text-brand-muted" />
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <SignOutButton className="rounded-xl px-3 py-3 text-brand-danger focus:bg-brand-danger/10 focus:text-brand-danger" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
