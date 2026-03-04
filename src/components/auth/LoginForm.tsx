"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { AuthDivider } from "@/components/auth/AuthDivider";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      if (authError.message === "Invalid login credentials") {
        setError("ელ-ფოსტა ან პაროლი არასწორია");
      } else {
        setError("შესვლა ვერ მოხერხდა. სცადეთ თავიდან.");
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        შესვლა
      </h1>
      <p className="mt-1.5 text-sm text-brand-muted">
        შეიყვანეთ თქვენი მონაცემები ანგარიშში შესასვლელად
      </p>

      <div className="mt-6">
        <GoogleOAuthButton />
      </div>

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-brand-danger/20 bg-red-50 px-4 py-3 text-sm text-brand-danger">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">პაროლი</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-primary hover:text-brand-primary-hover"
            >
              დავიწყდა პაროლი?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 rounded-xl pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-secondary"
              aria-label={showPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-sm font-semibold"
          disabled={loading}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          შესვლა
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        არ გაქვს ანგარიში?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-primary hover:text-brand-primary-hover"
        >
          დარეგისტრირდი
        </Link>
      </p>
    </div>
  );
}
