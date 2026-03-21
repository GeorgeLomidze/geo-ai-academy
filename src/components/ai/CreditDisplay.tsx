"use client";

import { Coins, Sparkles } from "lucide-react";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreditPurchaseModal } from "@/components/ai/CreditPurchaseModal";
import { Button } from "@/components/ui/button";

interface CreditDisplayProps {
  balance: number;
  compact?: boolean;
}

export function CreditDisplay({
  balance,
  compact = false,
}: CreditDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-3xl border border-brand-accent/20 bg-brand-surface px-4 py-4 shadow-sm",
        compact
          ? "w-auto rounded-full px-3 py-2.5"
          : "justify-between p-5 sm:p-6"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl border border-brand-accent/20 bg-brand-accent/10 text-brand-accent",
            compact ? "size-10 rounded-full" : "size-14"
          )}
        >
          <Coins className={cn(compact ? "size-5" : "size-7")} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-brand-muted">GEO კოინები</p>
          <p
            className={cn(
              "font-ui text-brand-secondary tabular-nums",
              compact ? "text-base font-semibold" : "text-3xl font-bold"
            )}
          >
            {formatInteger(balance)}
          </p>
        </div>
      </div>

      <CreditPurchaseModal
        trigger={
          <Button
            variant={compact ? "outline" : "default"}
            className={cn(
              compact
                ? "rounded-full border-brand-accent bg-brand-accent px-3 text-black hover:bg-brand-accent-hover hover:text-black"
                : "rounded-full bg-brand-accent text-black hover:bg-brand-accent-hover hover:text-black"
            )}
          >
            <Sparkles className="size-4" />
            კოინების შეძენა
          </Button>
        }
      />
    </div>
  );
}
