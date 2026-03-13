"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Settings, UserCircle } from "lucide-react";
import { NotificationDropdownSection } from "@/components/layout/NotificationDropdownSection";
import { useAdminNotifications } from "@/components/layout/AdminNotificationsProvider";
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

interface AdminTopbarProfileProps {
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}

export function AdminTopbarProfile({
  name,
  email,
  avatarUrl,
  initials,
}: AdminTopbarProfileProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAllRead,
    clearError,
  } = useAdminNotifications();

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
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
                alt={name}
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
          <div className="hidden text-left sm:block">
            <p className="max-w-32 truncate text-sm font-medium text-brand-secondary">
              {name}
            </p>
            <p className="text-xs text-brand-muted">ადმინისტრატორი</p>
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
                alt={name}
              />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-secondary">
                {name}
              </p>
              <p className="truncate text-xs text-brand-muted">{email}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary-light px-3 py-1 text-xs font-medium text-brand-primary">
                <Settings className="size-3.5" />
                ადმინისტრატორის მენიუ
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <NotificationDropdownSection
          title="ადმინის შეტყობინებები"
          unreadCount={unreadCount}
          items={notifications.map((notification) => ({
            id: notification.id,
            title: notification.authorName,
            description: notification.questionPreview,
            meta: notification.contextLabel,
            href: notification.linkUrl ?? "/admin/qa",
            isRead: notification.isRead,
            createdAt: notification.createdAt,
          }))}
          loading={loading}
          error={error}
          emptyTitle="ახალი შეტყობინებები არ არის"
          emptyDescription="როცა ახალი კითხვა დაემატება, აქ გამოჩნდება."
          onSelectItem={(item) => {
            clearError();
            router.push(item.href);
          }}
          onMarkAllRead={() => void markAllRead()}
        />

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
          >
            <UserCircle />
            პროფილი
            <ChevronRight className="ml-auto size-4 text-brand-muted" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/admin/settings"
            className="rounded-xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary"
          >
            <Settings />
            პარამეტრები
            <ChevronRight className="ml-auto size-4 text-brand-muted" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutButton className="rounded-xl px-3 py-3 text-brand-danger focus:bg-brand-danger/10 focus:text-brand-danger" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
