"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { AuthDivider } from "@/components/auth/AuthDivider";

const registerSchema = z
  .object({
    name: z.string().min(2, "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
    email: z.email("გთხოვთ შეიყვანოთ სწორი ელ-ფოსტა"),
    password: z.string().min(6, "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "პაროლები არ ემთხვევა",
    path: ["confirmPassword"],
  });

type FieldErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
        },
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.message.includes("already registered")) {
        setServerError("ეს ელ-ფოსტა უკვე რეგისტრირებულია");
      } else {
        setServerError("რეგისტრაცია ვერ მოხერხდა. სცადეთ თავიდან.");
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        რეგისტრაცია
      </h1>
      <p className="mt-1.5 text-sm text-brand-muted">
        შექმენით ახალი ანგარიში სწავლის დასაწყებად
      </p>

      <div className="mt-6">
        <GoogleOAuthButton />
      </div>

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="rounded-lg border border-brand-danger/20 bg-red-50 px-4 py-3 text-sm text-brand-danger">
            {serverError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">სახელი</Label>
          <Input
            id="name"
            type="text"
            placeholder="თქვენი სახელი"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            autoComplete="name"
            className="h-11 rounded-xl"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-brand-danger">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">ელ-ფოსტა</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            autoComplete="email"
            className="h-11 rounded-xl"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-brand-danger">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">პაროლი</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="მინიმუმ 6 სიმბოლო"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete="new-password"
              className="h-11 rounded-xl pr-10"
              aria-invalid={!!errors.password}
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
          {errors.password && (
            <p className="text-xs text-brand-danger">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">პაროლის დადასტურება</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="გაიმეორეთ პაროლი"
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            autoComplete="new-password"
            className="h-11 rounded-xl"
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-brand-danger">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-sm font-semibold"
          disabled={loading}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          რეგისტრაცია
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        უკვე გაქვს ანგარიში?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-primary hover:text-brand-primary-hover"
        >
          შესვლა
        </Link>
      </p>
    </div>
  );
}
