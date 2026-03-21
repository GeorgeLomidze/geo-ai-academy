"use client";

import { useState } from "react";
import { X, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REASON_OPTIONS = [
  { value: "ბონუსი", label: "ბონუსი" },
  { value: "აქცია", label: "აქცია" },
  { value: "კომპენსაცია", label: "კომპენსაცია" },
  { value: "სხვა", label: "სხვა" },
] as const;

interface BulkCreditModalProps {
  open: boolean;
  studentCount: number;
  onClose: () => void;
  onSaved: () => void;
}

export function BulkCreditModal({
  open,
  studentCount,
  onClose,
  onSaved,
}: BulkCreditModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<string>(REASON_OPTIONS[0].value);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    setAmount("");
    setReason(REASON_OPTIONS[0].value);
    setNote("");
    setConfirmed(false);
    setError(null);
    onClose();
  }

  async function handleSave() {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) return;

    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/credits/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          reason,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "შეცდომა მოხდა");
        setConfirmed(false);
        return;
      }

      onSaved();
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  const numAmount = parseInt(amount, 10);
  const isValid = numAmount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Coins className="size-5 text-brand-accent" />
            <h2 className="font-display text-lg font-bold text-brand-secondary">
              ყველასთვის კრედიტების დამატება
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-surface-light hover:text-brand-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-muted">
              რაოდენობა (თითო სტუდენტზე)
            </label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setConfirmed(false); setError(null); }}
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
              onChange={(e) => { setReason(e.target.value); setConfirmed(false); }}
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

          {confirmed && isValid ? (
            <div className="rounded-lg border border-brand-primary/30 bg-brand-primary-light p-3 text-sm text-brand-primary">
              ნამდვილად გსურთ ✦ {numAmount.toLocaleString("ka-GE")} კოინის დამატება {studentCount} სტუდენტისთვის?
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          ) : null}

          <Button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="h-10 w-full rounded-lg bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : confirmed ? (
              "დადასტურება"
            ) : (
              `+ ${isValid ? numAmount.toLocaleString("ka-GE") : "0"} კრედიტის დამატება ყველასთვის`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
