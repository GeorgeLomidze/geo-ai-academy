import Link from "next/link";
import { LogOut, User, LayoutDashboard, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { navItems, siteConfig } from "@/lib/constants";
import { Button } from "@/components/ui/button";
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

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-brand-secondary"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">
            G
          </span>
          {siteConfig.name}
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand-primary">
                  <Avatar>
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.user_metadata?.name ?? user.email ?? ""}
                    />
                    <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                      {getInitials(user.user_metadata?.name, user.email ?? "")}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">
                    {user.user_metadata?.name ?? "მომხმარებელი"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    სამუშაო პანელი
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User />
                    პროფილი
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/api/auth/signout" method="POST">
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut className="size-4" />
                      გასვლა
                    </button>
                  </form>
                </DropdownMenuItem>
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
          <MobileNavToggle isAuthenticated={!!user} />
        </div>
      </nav>
    </header>
  );
}
