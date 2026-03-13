"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { QAImagePreview } from "@/components/qa/QAImagePreview";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface QAImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  error?: string | null;
  maxImages?: number;
}

export function QAImageUploader({
  value,
  onChange,
  error = null,
  maxImages = 6,
}: QAImageUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const canAddMore = value.length < maxImages;

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const supabase = createSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uploadedUrls: string[] = [];
      const remainingSlots = maxImages - value.length;

      for (const file of files.slice(0, remainingSlots)) {
        const formData = new FormData();
        formData.append("file", file);

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

        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }
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

  function handleRemove(imageUrl: string) {
    onChange(value.filter((currentUrl) => currentUrl !== imageUrl));
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start gap-3">
        {value.map((imageUrl, index) => (
          <div key={`${imageUrl}-${index}`} className="space-y-2">
            <QAImagePreview
              src={imageUrl}
              alt={`Q&A მიმაგრებული სურათი ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-brand-danger hover:bg-brand-danger/10 hover:text-brand-danger"
              onClick={() => handleRemove(imageUrl)}
            >
              <Trash2 className="size-4" />
              წაშლა
            </Button>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={inputId}>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={handleFileSelect}
              disabled={uploading || !canAddMore}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={uploading || !canAddMore}
              asChild
            >
              <span>
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : value.length > 0 ? (
                  <RefreshCcw className="size-4" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {value.length > 0 ? "მეტი სურათის დამატება" : "სურათების დამატება"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      <p className="text-xs text-brand-muted">
        სურვილის შემთხვევაში დაურთე screenshot ან ფოტო. მაქსიმუმ {maxImages} სურათი, თითოეული 5MB-მდე.
      </p>

      {uploadError || error ? (
        <p role="alert" className="text-sm text-brand-danger">
          {uploadError ?? error}
        </p>
      ) : null}
    </div>
  );
}
