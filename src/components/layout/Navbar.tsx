import Link from "next/link";
import type { NotificationDropdownItem } from "@/components/layout/NotificationDropdownSection";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAdminNotifications, getUserNotifications } from "@/lib/qa";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AIToolsNavDropdown } from "@/components/layout/AIToolsNavDropdown";
import { NavbarAccountMenu } from "@/components/layout/NavbarAccountMenu";
import { PublicNavLink } from "@/components/layout/PublicNavLink";
import { MobileNavToggle } from "@/components/layout/MobileNavToggle";

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "U";
}

const desktopNavLinkClass = cn(
  "font-nav inline-flex items-center py-2 text-sm font-medium text-brand-muted transition-colors duration-200",
  "hover:text-brand-secondary focus-visible:text-brand-secondary focus-visible:outline-none"
);

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, name: true, avatarUrl: true },
      })
    : null;
  const isAdmin = user
    ? user.user_metadata?.role === "admin" || profile?.role === "ADMIN"
    : false;
  const displayName =
    profile?.name ?? user?.user_metadata?.name ?? user?.email ?? "მომხმარებელი";
  const avatarUrl = profile?.avatarUrl ?? undefined;
  const initialNotificationData = user
    ? isAdmin
      ? await getAdminNotifications(12)
      : await getUserNotifications(user.id, 12)
    : { notifications: [], unreadCount: 0 };
  const initialNotificationItems: NotificationDropdownItem[] = isAdmin
    ? []
    : initialNotificationData.notifications.map((notification) => ({
        id: notification.id,
        title: notification.authorName,
        description: notification.questionPreview,
        href: notification.linkUrl ?? "/dashboard",
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      }));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo
          priority
          className="self-center"
          imageClassName="w-[234px] translate-y-0.5 sm:w-[264px]"
        />

        {/* Right side */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden items-center gap-6 md:flex" aria-label="მთავარი ნავიგაცია">
            {navItems.map((item) => (
              item.href === "/ai-tools" ? (
                <AIToolsNavDropdown key={item.href} className={desktopNavLinkClass} />
              ) : (
                <PublicNavLink
                  key={item.href}
                  href={item.href}
                  className={desktopNavLinkClass}
                >
                  {item.label}
                </PublicNavLink>
              )
            ))}
          </div>

          {user ? (
            <NavbarAccountMenu
              displayName={displayName}
              email={user.email ?? ""}
              avatarUrl={avatarUrl}
              initials={getInitials(displayName, user.email ?? "")}
              isAdmin={isAdmin}
              notificationEndpoint={isAdmin ? "/api/admin/notifications" : "/api/notifications"}
              initialUnreadCount={initialNotificationData.unreadCount}
              initialNotificationItems={initialNotificationItems}
              showNotificationList={!isAdmin}
            />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="outline"
                asChild
                className="rounded-full border-brand-primary/55 bg-brand-primary/5 px-5 text-brand-secondary transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-primary hover:bg-brand-primary/12 hover:text-brand-secondary"
              >
                <Link href="/login">შესვლა</Link>
              </Button>
              <Button asChild>
                <Link href="/register">რეგისტრაცია</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <MobileNavToggle isAuthenticated={!!user} isAdmin={isAdmin} />
        </div>
      </nav>
    </header>
  );
}
