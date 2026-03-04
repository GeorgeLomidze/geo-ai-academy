"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateProfile, type ProfileState } from "@/app/(student)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileState = { success: false };

export function ProfileForm({
  defaultName,
  defaultAvatarUrl,
  email,
}: {
  defaultName: string;
  defaultAvatarUrl: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
      <h2 className="font-display text-lg font-semibold text-brand-secondary">
        პირადი ინფორმაცია
      </h2>

      <form action={formAction} className="mt-5 space-y-4">
        {state.error && (
          <div className="rounded-lg border border-brand-danger/20 bg-red-50 px-4 py-3 text-sm text-brand-danger">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="flex items-center gap-2 rounded-lg border border-brand-accent/20 bg-emerald-50 px-4 py-3 text-sm text-brand-accent">
            <Check className="size-4" />
            პროფილი წარმატებით განახლდა
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">სახელი</Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={defaultName}
            placeholder="თქვენი სახელი"
            className="h-11 rounded-xl"
            aria-invalid={!!state.fieldErrors?.name}
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-brand-danger">{state.fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">ელ-ფოსტა</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="h-11 rounded-xl bg-muted"
          />
          <p className="text-xs text-brand-muted">
            ელ-ფოსტის შეცვლა შეუძლებელია
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">ავატარის URL</Label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            defaultValue={defaultAvatarUrl}
            placeholder="https://example.com/avatar.jpg"
            className="h-11 rounded-xl"
            aria-invalid={!!state.fieldErrors?.avatarUrl}
          />
          {state.fieldErrors?.avatarUrl && (
            <p className="text-xs text-brand-danger">
              {state.fieldErrors.avatarUrl}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="rounded-xl"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          შენახვა
        </Button>
      </form>
    </div>
  );
}
