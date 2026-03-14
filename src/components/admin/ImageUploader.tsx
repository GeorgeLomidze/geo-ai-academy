"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
};

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("მხოლოდ სურათის ფაილები არის ნებადართული");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "ატვირთვა ვერ მოხერხდა");
        return;
      }

      onChange(data.url);
    } catch {
      setError("ატვირთვა ვერ მოხერხდა");
    } finally {
      setUploading(false);
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

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative h-40 w-64 overflow-hidden rounded-xl border border-brand-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="კურსის სურათი"
            className="size-full object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1 size-7 rounded-lg bg-black/50 p-0 text-white hover:bg-black/70"
          >
            <X className="size-4" />
            <span className="sr-only">წაშლა</span>
          </Button>
        </div>
        <label
          htmlFor="image-upload-replace"
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-brand-primary hover:underline"
        >
          <ImageIcon className="size-3.5" />
          სურათის შეცვლა
          <input
            ref={fileInputRef}
            id="image-upload-replace"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="image-upload"
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
          uploading
            ? "border-brand-primary bg-brand-primary-light/50"
            : "border-brand-border hover:border-brand-primary hover:bg-brand-primary-light/30"
        }`}
      >
        {uploading ? (
          <Loader2 className="size-8 animate-spin text-brand-primary" />
        ) : (
          <Upload className="size-8 text-brand-muted" />
        )}
        <div className="text-center">
          {uploading ? (
            <p className="text-sm font-medium text-brand-primary">
              იტვირთება...
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-brand-secondary">
                აირჩიეთ სურათი
              </p>
              <p className="text-xs text-brand-muted">
                JPEG, PNG, WebP - მაქსიმუმ 5MB
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </label>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-danger/20 bg-brand-danger/10 px-3 py-2">
          <p className="min-w-0 text-sm text-brand-danger">{error}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="size-7 shrink-0 rounded-lg p-0 text-brand-danger hover:bg-brand-danger/10"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
