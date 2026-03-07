"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type AvatarUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
};

export function AvatarUploader({
  value,
  onChange,
  onUploadingChange,
  disabled = false,
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setUploadingState(nextValue: boolean) {
    setUploading(nextValue);
    onUploadingChange?.(nextValue);
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("მხოლოდ სურათის ატვირთვაა შესაძლებელი");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს");
      return;
    }

    setError(null);
    setUploadingState(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "ავატარის ატვირთვა ვერ მოხერხდა");
      }

      onChange(data.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "ავატარის ატვირთვა ვერ მოხერხდა"
      );
    } finally {
      setUploadingState(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleClear() {
    onChange("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-border bg-brand-surface-light">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="ავატარის პრევიუ"
                className="size-full object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled || uploading}
                className="absolute bottom-1 right-1 size-8 rounded-full bg-black/60 p-0 text-white hover:bg-black/75"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">ავატარის წაშლა</span>
              </Button>
            </>
          ) : (
            <div className="flex size-full items-center justify-center bg-brand-primary-light text-brand-primary">
              <User className="size-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="avatar-upload"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-border bg-brand-surface-light px-4 py-2 text-sm font-medium text-brand-secondary transition-colors duration-200 hover:border-brand-primary/30 hover:bg-brand-surface disabled:pointer-events-none disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin text-brand-primary" />
            ) : (
              <ImagePlus className="size-4 text-brand-primary" />
            )}
            {uploading ? "იტვირთება..." : "ფოტოს ატვირთვა"}
            <input
              ref={fileInputRef}
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
            />
          </label>
          <p className="text-xs leading-5 text-brand-muted">
            ატვირთე JPG, PNG, WebP ან AVIF ფაილი. მაქსიმალური ზომა 5MB.
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-brand-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
