"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { navItems, studentNavItems } from "@/lib/constants";
import { PublicNavLink } from "@/components/layout/PublicNavLink";
import { Button } from "@/components/ui/button";

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
              <PublicNavLink
                key={item.href}
                href={item.href}
                onNavigate={() => setOpen(false)}
                className="font-nav rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
              >
                {item.label}
              </PublicNavLink>
            ))}
            {isAuthenticated && (
              <>
                <hr className="my-2 border-brand-border" />
                {studentNavItems.map((item) => (
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
