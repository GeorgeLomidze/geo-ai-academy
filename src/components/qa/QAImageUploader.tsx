"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { QAImagePreview } from "@/components/qa/QAImagePreview";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface QAImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  error?: string | null;
}

export function QAImageUploader({
  value,
  onChange,
  error = null,
}: QAImageUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const supabase = createSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/qa/upload-image", {
        method: "POST",
        credentials: "include",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "სურათის ატვირთვა ვერ მოხერხდა");
      }

      onChange(data.url);
    } catch (nextError) {
      setUploadError(
        nextError instanceof Error
          ? nextError.message
          : "სურათის ატვირთვა ვერ მოხერხდა"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove() {
    onChange("");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          <QAImagePreview src={value} alt="Q&A მიმაგრებული სურათი" />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={inputId}>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : value ? (
                  <RefreshCcw className="size-4" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {value ? "სურათის შეცვლა" : "სურათის დამატება"}
              </span>
            </Button>
          </label>

          {value ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-brand-danger hover:bg-brand-danger/10 hover:text-brand-danger"
              onClick={handleRemove}
            >
              <Trash2 className="size-4" />
              წაშლა
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-brand-muted">
        სურვილის შემთხვევაში დაურთე screenshot ან ფოტო. მაქსიმუმ 5MB.
      </p>

      {uploadError || error ? (
        <p role="alert" className="text-sm text-brand-danger">
          {uploadError ?? error}
        </p>
      ) : null}
    </div>
  );
}
