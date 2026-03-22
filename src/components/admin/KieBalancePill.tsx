"use client";

import { useEffect, useState } from "react";
import type { KieBalance } from "@/lib/kie/balance";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getPillClasses(credits: number) {
  if (credits >= 10_000)
    return "border-brand-success/20 bg-brand-success/10 text-brand-success";
  if (credits >= 5_000)
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-400";
  return "border-brand-danger/20 bg-brand-danger/10 text-brand-danger";
}

export function KieBalancePill() {
  const [balance, setBalance] = useState<KieBalance | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await fetch("/api/admin/kie-balance");
        if (!response.ok) return;
        const data = (await response.json()) as KieBalance;
        setBalance(data);
      } catch {
        // Silently fail in topbar
      }
    }

    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (!balance) return null;

  const { credits } = balance;

  return (
    <a
      href="https://kie.ai/pricing"
      target="_blank"
      rel="noopener noreferrer"
      title="Kie.ai კრედიტების ბალანსი"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${getPillClasses(credits)}`}
    >
      KIE &#10022; {credits.toLocaleString("ka-GE")}
    </a>
  );
}
