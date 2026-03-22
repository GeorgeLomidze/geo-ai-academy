"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import type { KieBalance } from "@/lib/kie/balance";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getBalanceColor(credits: number) {
  if (credits >= 10_000) return "text-brand-success";
  if (credits >= 5_000) return "text-yellow-400";
  return "text-brand-danger";
}

function getBalanceBg(credits: number) {
  if (credits >= 10_000) return "";
  if (credits >= 5_000) return "border-yellow-400/30 bg-yellow-400/5";
  return "border-brand-danger/30 bg-brand-danger/5";
}

function getIconBg(credits: number) {
  if (credits >= 10_000) return "bg-brand-success/10 text-brand-success";
  if (credits >= 5_000) return "bg-yellow-400/10 text-yellow-400";
  return "bg-brand-danger/10 text-brand-danger";
}

export function KieBalanceCard() {
  const [balance, setBalance] = useState<KieBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchBalance() {
    try {
      const response = await fetch("/api/admin/kie-balance");
      if (!response.ok) throw new Error();
      const data = (await response.json()) as KieBalance;
      setBalance(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-light">
            <Sparkles className="size-5 text-brand-primary" />
          </div>
          <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
        </div>
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-white/5" />
        <p className="mt-0.5 text-xs text-brand-muted">Kie.ai კრედიტები</p>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-light">
            <Sparkles className="size-5 text-brand-primary" />
          </div>
          <button
            onClick={() => {
              setLoading(true);
              void fetchBalance();
            }}
            className="text-xs text-brand-muted transition-colors hover:text-brand-secondary"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-brand-muted">ვერ ჩაიტვირთა</p>
        <p className="mt-0.5 text-xs text-brand-muted">Kie.ai კრედიტები</p>
      </div>
    );
  }

  const { credits } = balance;

  return (
    <div
      className={`rounded-2xl border border-brand-border bg-brand-surface p-5 transition-all duration-200 hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(245,166,35,0.1)] ${getBalanceBg(credits)}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${getIconBg(credits)}`}
        >
          <Sparkles className="size-5" />
        </div>
        <button
          onClick={() => {
            setLoading(true);
            void fetchBalance();
          }}
          className="text-xs text-brand-muted transition-colors hover:text-brand-secondary"
          title="განახლება"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>
      <p
        className={`mt-3 font-display text-2xl font-bold ${getBalanceColor(credits)}`}
      >
        {credits.toLocaleString("ka-GE")}
      </p>
      <p className="mt-0.5 text-xs text-brand-muted">Kie.ai კრედიტები</p>
      <p className="mt-2 text-xs text-brand-muted">
        {credits.toLocaleString("ka-GE")} კრედიტი &asymp; $
        {(credits * 0.005).toFixed(2)}
      </p>
    </div>
  );
}
