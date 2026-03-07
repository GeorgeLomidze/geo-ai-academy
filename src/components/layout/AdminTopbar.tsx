import Link from "next/link";
import { Bell, ChevronRight, Settings, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { prisma } from "@/lib/prisma";

export async function AdminTopbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, avatarUrl: true },
      })
    : null;

  const name = profile?.name ?? user?.user_metadata?.name ?? "ადმინისტრატორი";
  const email = user?.email ?? "";
  const avatarUrl = profile?.avatarUrl ?? undefined;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-border bg-brand-background px-4 sm:px-6">
      <div />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-brand-muted hover:bg-brand-surface"
          aria-label="შეტყობინებები"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-danger" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 outline-none ring-offset-2 transition-colors duration-200 hover:border-brand-primary/30 hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-brand-primary">
              <Avatar data-size="lg">
                <AvatarImage
                  src={avatarUrl}
                  alt={name}
                />
                <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
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
            className="w-72 rounded-2xl border-white/10 bg-[#111111] p-2 text-brand-secondary shadow-2xl"
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
      </div>
    </header>
  );
}
