"use client";

import { useState, type ReactNode } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { formatInteger } from "@/lib/format";
import { CREDIT_PACKAGES } from "@/lib/credits/packages";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreditPurchaseModalProps {
  trigger: ReactNode;
}

const CARD_THEMES = {
  starter: {
    panelClass: "border-white/10 bg-[#11151d]",
    tagClass: "bg-[#1b2534] text-white/80",
    buttonClass:
      "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-brand-accent/30",
    tagline: "პირველი ნაბიჯებისთვის",
  },
  standard: {
    panelClass: "border-brand-accent/30 bg-[#15120a]",
    tagClass: "bg-brand-accent text-black",
    buttonClass:
      "bg-brand-accent text-black hover:bg-brand-accent-hover hover:text-black",
    tagline: "ყველაზე მოთხოვნადი არჩევანი",
    popular: true,
  },
  premium: {
    panelClass: "border-white/10 bg-[#17191f]",
    tagClass: "bg-[#2d323b] text-white/80",
    buttonClass:
      "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-brand-accent/30",
    tagline: "ინტენსიური მუშაობისთვის",
  },
} as const;

export function CreditPurchaseModal({ trigger }: CreditPurchaseModalProps) {
  const [open, setOpen] = useState(false);
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(packageId: string) {
    setLoadingPackageId(packageId);
    setError(null);

    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        setError(data.error ?? "კოინების შეძენა ვერ მოხერხდა");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("კოინების შეძენა ვერ მოხერხდა");
    } finally {
      setLoadingPackageId(null);
    }
  }

  const packages = Object.values(CREDIT_PACKAGES);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-6xl gap-0 overflow-hidden rounded-3xl border-white/10 bg-[#080808] p-0 text-white shadow-2xl sm:max-w-6xl [&>button]:hidden">
        <DialogTitle className="sr-only">GEO კოინების პაკეტების არჩევა</DialogTitle>
        {/* Header */}
        <div className="relative border-b border-white/5 px-6 pb-5 pt-6 text-center sm:px-10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="focus-ring absolute right-5 top-5 flex size-9 items-center justify-center rounded-full text-white/35 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" />
          </button>

          <div className="mx-auto mb-2.5 inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs text-brand-accent">
            <Sparkles className="size-3.5" />
            GEO კოინების პაკეტები
          </div>

          <h2 className="font-ui text-2xl font-bold sm:text-3xl">
            აირჩიე შენი პაკეტი
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#8A8A8A] text-pretty">
            შეიძინე GEO კოინები და შექმენი AI სურათები და ვიდეოები საუკეთესო მოდელებით.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:px-7 lg:grid-cols-3">
          {packages.map((pkg) => {
            const theme = CARD_THEMES[pkg.id as keyof typeof CARD_THEMES];
            if (!theme) return null;

            const isLoading = loadingPackageId === pkg.id;
            const isPopular = pkg.id === "standard";

            const features = [
              `~${formatInteger(pkg.estimatedImages)} სურათი`,
              `~${formatInteger(pkg.estimatedVideos)} ვიდეო`,
              "ყველა მოდელი",
              "სწრაფი გენერაცია",
            ];
            if (pkg.bonusLabel) features.push(pkg.bonusLabel);

            return (
              <section
                key={pkg.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 transition-all",
                  theme.panelClass,
                  isPopular && "shadow-[0_0_30px_-8px_rgba(255,214,10,0.15)]"
                )}
              >
                {/* Top row: badge + tagline + popular tag */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        theme.tagClass
                      )}
                    >
                      {pkg.name}
                    </span>
                    <span className="text-xs text-white/40">{theme.tagline}</span>
                  </div>
                  {isPopular ? (
                    <span className="shrink-0 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-accent">
                      პოპულარული
                    </span>
                  ) : null}
                </div>

                {/* Price row */}
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black leading-none tabular-nums text-white">
                      {pkg.amount}
                    </span>
                    <span className="pb-0.5 text-xl font-semibold text-white/35">₾</span>
                  </div>
                  {pkg.bonusLabel ? (
                    <span className="rounded-full border border-brand-accent/25 bg-brand-accent/10 px-2.5 py-0.5 text-xs font-semibold text-brand-accent">
                      {pkg.bonusLabel}
                    </span>
                  ) : null}
                </div>

                <div className="my-4 h-px bg-white/[0.06]" />

                {/* Features in 2-column grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-[13px] text-white/80"
                    >
                      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  className={cn(
                    "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors",
                    theme.buttonClass
                  )}
                  disabled={loadingPackageId !== null}
                  onClick={() => void handlePurchase(pkg.id)}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {isLoading ? "მუშავდება..." : "შეძენა"}
                </button>
              </section>
            );
          })}
        </div>

        {error ? (
          <p className="px-6 pb-5 text-center text-sm text-red-400">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
