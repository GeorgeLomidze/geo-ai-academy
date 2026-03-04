"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { navItems } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function MobileNavToggle({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
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
        <div className="absolute left-0 top-16 z-50 w-full border-b border-brand-border bg-brand-surface p-4 shadow-lg">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <hr className="my-2 border-brand-border" />
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-primary-light hover:text-brand-primary"
                >
                  შესვლა
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary-light"
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
