"use client";

import { useActionState, useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { updatePassword, type ProfileState } from "@/app/(student)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileState = { success: false };

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
      <h2 className="font-display text-lg font-semibold text-brand-secondary">
        პაროლის შეცვლა
      </h2>

      <form action={formAction} className="mt-5 space-y-4">
        {state.error && (
          <div role="alert" className="rounded-lg border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="flex items-center gap-2 rounded-lg border border-brand-accent/20 bg-brand-success/10 px-4 py-3 text-sm text-brand-accent">
            <Check className="size-4" />
            პაროლი წარმატებით შეიცვალა
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">ახალი პაროლი</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="მინიმუმ 6 სიმბოლო"
              autoComplete="new-password"
              className="h-11 rounded-xl pr-10"
              aria-invalid={!!state.fieldErrors?.password}
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
          {state.fieldErrors?.password && (
            <p className="text-xs text-brand-danger">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">პაროლის დადასტურება</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="გაიმეორეთ პაროლი"
            autoComplete="new-password"
            className="h-11 rounded-xl"
            aria-invalid={!!state.fieldErrors?.confirmPassword}
          />
          {state.fieldErrors?.confirmPassword && (
            <p className="text-xs text-brand-danger">
              {state.fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="rounded-xl"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          პაროლის შეცვლა
        </Button>
      </form>
    </div>
  );
}
