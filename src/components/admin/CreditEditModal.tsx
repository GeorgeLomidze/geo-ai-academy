"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TransactionRecord = {
  id: string;
  amount: number;
  type: string;
  description: string;
  modelUsed: string | null;
  createdAt: string;
};

type UserDetail = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  balance: number;
};

const REASON_OPTIONS = [
  { value: "ბონუსი", label: "ბონუსი" },
  { value: "აქცია", label: "აქცია" },
  { value: "კომპენსაცია", label: "კომპენსაცია" },
  { value: "სხვა", label: "სხვა" },
] as const;

const dateFormatter = new Intl.DateTimeFormat("ka-GE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getInitials(name: string | null, email: string) {
  if (!name) return email.slice(0, 2).toUpperCase();
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CreditEditModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CreditEditModal({
  userId,
  open,
  onClose,
  onSaved,
}: CreditEditModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<string>(REASON_OPTIONS[0].value);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !userId) return;

    setMode("add");
    setAmount("");
    setReason(REASON_OPTIONS[0].value);
    setNote("");
    setError(null);

    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/credits/${userId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          user: UserDetail;
          transactions: TransactionRecord[];
        };
        setUser(data.user);
        setTransactions(data.transactions);
      } finally {
        setLoading(false);
      }
    }

    void fetchUser();
  }, [open, userId]);

  if (!open || !userId) return null;

  async function handleSave() {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) return;

    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/credits/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          type: mode === "add" ? "ADMIN_GRANT" : "ADMIN_DEDUCT",
          reason,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        if (res.status === 400) {
          setError("ბალანსი არ შეიძლება იყოს უარყოფითი");
        } else {
          setError(data.error ?? "შეცდომა მოხდა");
        }
        return;
      }

      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-display text-lg font-bold text-brand-secondary">
            კრედიტების მართვა
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-surface-light hover:text-brand-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-brand-muted" />
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* User info */}
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-secondary">
                    {user.name ?? "უსახელო"}
                  </p>
                  <p className="truncate text-sm text-brand-muted">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-muted">მიმდინარე ბალანსი</p>
                  <p className="text-2xl font-bold tabular-nums text-brand-accent">
                    ✦ {user.balance.toLocaleString("ka-GE")}
                  </p>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setMode("add"); setError(null); }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === "add"
                      ? "bg-green-500/10 text-green-400"
                      : "text-brand-muted hover:text-brand-secondary"
                  }`}
                >
                  <Plus className="size-4" />
                  დამატება
                </button>
                <button
                  onClick={() => { setMode("deduct"); setError(null); }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === "deduct"
                      ? "bg-red-500/10 text-red-400"
                      : "text-brand-muted hover:text-brand-secondary"
                  }`}
                >
                  <Minus className="size-4" />
                  ჩამოჭრა
                </button>
              </div>

              {/* Form */}
              <div className="space-y-3 rounded-xl border border-brand-border bg-brand-background p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-muted">
                    რაოდენობა
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(null); }}
                    placeholder="მაგ. 500"
                    className="h-10 rounded-lg"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-muted">
                    მიზეზი
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-10 w-full rounded-lg border border-brand-border bg-brand-surface px-3 text-sm text-brand-secondary"
                  >
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-muted">
                    შენიშვნა (არასავალდებულო)
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="დამატებითი ინფორმაცია..."
                    className="h-10 rounded-lg"
                  />
                </div>

                {error ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                ) : null}

                <Button
                  onClick={handleSave}
                  disabled={saving || !amount || parseInt(amount, 10) <= 0}
                  className={`h-10 w-full rounded-lg ${
                    mode === "add"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : mode === "add" ? (
                    `+ ${amount || "0"} კრედიტის დამატება`
                  ) : (
                    `- ${amount || "0"} კრედიტის ჩამოჭრა`
                  )}
                </Button>
              </div>

              {/* Transaction history */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-brand-muted">
                  ტრანზაქციების ისტორია
                </h3>
                {transactions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-brand-muted">
                    ტრანზაქციები არ მოიძებნა
                  </p>
                ) : (
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-brand-surface-light"
                      >
                        <span className="text-xs tabular-nums text-brand-muted">
                          {dateFormatter.format(new Date(tx.createdAt))}
                        </span>
                        <span
                          className={`min-w-16 font-medium tabular-nums ${
                            tx.amount >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {tx.amount.toLocaleString("ka-GE")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-brand-secondary">
                          {tx.description}
                        </span>
                        {tx.modelUsed ? (
                          <span className="shrink-0 rounded bg-brand-surface px-1.5 py-0.5 text-xs text-brand-muted">
                            {tx.modelUsed}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
