import Link from "next/link";
import { ChevronRight, User, LayoutDashboard, Shield, Sparkles, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { navItems, studentNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  "group relative inline-flex items-center py-2 text-sm font-medium text-brand-muted transition-colors duration-200",
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
              <Link key={item.href} href={item.href} className={desktopNavLinkClass}>
                {item.label}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-brand-primary transition-transform duration-200 group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100"
                />
              </Link>
            ))}
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 outline-none ring-offset-2 transition-colors duration-200 hover:border-brand-primary/30 hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-brand-primary">
                  <Avatar data-size="lg">
                    <AvatarImage
                      src={avatarUrl}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                      {getInitials(displayName, user.email ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="max-w-32 truncate text-sm font-medium text-brand-secondary">
                      {displayName}
                    </p>
                    <p className="max-w-32 truncate text-xs text-brand-muted">
                      პროფილი
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-72 rounded-2xl border-white/10 bg-[#111111] p-2 text-brand-secondary shadow-2xl"
              >
                <DropdownMenuLabel className="rounded-xl border border-white/10 bg-white/[0.03] p-4 font-normal">
                  <div className="flex items-start gap-3">
                    <Avatar data-size="lg">
                      <AvatarImage
                        src={avatarUrl}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                        {getInitials(displayName, user.email ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-secondary">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-brand-muted">{user.email}</p>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary-light px-3 py-1 text-xs font-medium text-brand-primary">
                        <Sparkles className="size-3.5" />
                        {isAdmin ? "ადმინის წვდომა" : "სტუდენტის ანგარიში"}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild>
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
