"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { aiToolNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AIToolsNavDropdownProps {
  className?: string;
}

export function AIToolsNavDropdown({ className }: AIToolsNavDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/ai-tools"
        className={cn(
          "font-nav focus-ring inline-flex items-center gap-2 py-2 text-sm font-medium text-brand-muted transition-colors duration-200 hover:text-brand-secondary focus-visible:text-brand-secondary",
          className
        )}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>AI ინსტრუმენტები</span>
        <ChevronDown
          className={cn(
            "size-4 text-brand-muted transition-transform duration-200",
            open && "rotate-180 text-brand-secondary"
          )}
        />
      </Link>

      <div
        className={cn(
          "absolute left-1/2 top-full z-50 w-[340px] -translate-x-1/2 pt-3 transition-opacity duration-150 ease-out",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="rounded-[24px] border border-brand-border bg-[#111111] p-2 text-brand-secondary shadow-xl">
          <div className="rounded-[18px] border border-white/5 bg-white/[0.02] p-1">
            {aiToolNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-brand-accent/10 focus-visible:bg-brand-accent/10 focus-visible:outline-none"
              >
                <span className="text-2xl leading-none" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="block min-w-0 truncate text-sm font-medium text-brand-secondary">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
