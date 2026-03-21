"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { aiToolNavItems, navItems, studentNavItems } from "@/lib/constants";
import { PublicNavLink } from "@/components/layout/PublicNavLink";
import { Button } from "@/components/ui/button";

const mobileStudentItems = studentNavItems.filter(
  (item) => item.href !== "/ai-tools"
);

export function MobileNavToggle({
  isAuthenticated,
  isAdmin = false,
}: {
  isAuthenticated: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label={open ? "მენიუს დახურვა" : "მენიუს გახსნა"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open && (
        <div className="absolute left-0 top-16 z-50 w-full border-b border-brand-border bg-brand-background/95 p-4 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              item.href === "/ai-tools" ? (
                <div key={item.href} className="rounded-xl border border-brand-border bg-brand-surface/40 p-1">
                  <PublicNavLink
                    href={item.href}
                    onNavigate={() => setOpen(false)}
                    className="font-nav block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-secondary transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
                  >
                    {item.label}
                  </PublicNavLink>
                  <div className="mt-1 space-y-1 border-t border-brand-border pt-1">
                    {aiToolNavItems.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
                      >
                        <span aria-hidden="true">{tool.emoji}</span>
                        <span>{tool.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <PublicNavLink
                  key={item.href}
                  href={item.href}
                  onNavigate={() => setOpen(false)}
                  className="font-nav rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
                >
                  {item.label}
                </PublicNavLink>
              )
            ))}
            {isAuthenticated && (
              <>
                <hr className="my-2 border-brand-border" />
                {mobileStudentItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="font-nav rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="font-nav rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
                  >
                    ადმინის პანელი
                  </Link>
                ) : null}
              </>
            )}
            {!isAuthenticated && (
              <>
                <hr className="my-2 border-brand-border" />
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="font-nav rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
                >
                  შესვლა
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-brand-accent px-3 py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-accent-hover"
                >
                  რეგისტრაცია
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
