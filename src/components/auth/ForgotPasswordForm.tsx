"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError("მოთხოვნა ვერ გაიგზავნა. სცადეთ თავიდან.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-brand-accent/10">
            <Mail className="size-7 text-brand-accent" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-brand-secondary">
            შეამოწმეთ ელ-ფოსტა
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            ბმული გამოგზავნილია თქვენს ელ-ფოსტაზე{" "}
            <span className="font-medium text-brand-secondary">{email}</span>
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            თუ წერილი ვერ იპოვეთ, შეამოწმეთ სპამის საქაღალდე
          </p>
          <Button asChild variant="ghost" className="mt-6">
            <Link href="/login">
              <ArrowLeft className="size-4" />
              შესვლის გვერდზე დაბრუნება
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        პაროლის აღდგენა
      </h1>
      <p className="mt-1.5 text-sm text-brand-muted">
        შეიყვანეთ ელ-ფოსტა და გამოგიგზავნით აღდგენის ბმულს
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-brand-danger/20 bg-red-50 px-4 py-3 text-sm text-brand-danger">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">ელ-ფოსტა</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11 rounded-xl"
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-sm font-semibold"
          disabled={loading}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          ბმულის გაგზავნა
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-brand-primary hover:text-brand-primary-hover"
        >
          <ArrowLeft className="size-3.5" />
          შესვლის გვერდზე დაბრუნება
        </Link>
      </p>
    </div>
  );
}
