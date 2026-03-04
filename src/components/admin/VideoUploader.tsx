"use client";

import { useState, useRef } from "react";
import { Upload, X, Film, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type VideoUploaderProps = {
  onUploadComplete: (videoId: string) => void;
  existingVideoId?: string | null;
};

export function VideoUploader({
  onUploadComplete,
  existingVideoId,
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(
    existingVideoId ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("მხოლოდ ვიდეო ფაილები არის ნებადართული");
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError("ფაილის ზომა არ უნდა აღემატებოდეს 2GB-ს");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // 1. Create video on Bunny, get upload URL
      const createRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error ?? "ვიდეოს შექმნა ვერ მოხერხდა");
      }

      const { videoId: newVideoId, uploadUrl, tusHeaders } =
        await createRes.json();

      // 2. Upload using TUS protocol via dynamic import
      const { Upload: TusUpload } = await import("tus-js-client");

      const upload = new TusUpload(file, {
        endpoint: uploadUrl,
        headers: tusHeaders,
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onProgress(bytesUploaded, bytesTotal) {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(pct);
        },
        onSuccess() {
          setVideoId(newVideoId);
          setUploading(false);
          onUploadComplete(newVideoId);
        },
        onError(err) {
          setError(err.message ?? "ატვირთვა ვერ მოხერხდა");
          setUploading(false);
        },
      });

      upload.start();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ატვირთვა ვერ მოხერხდა"
      );
      setUploading(false);
    }
  }

  function handleClear() {
    setVideoId(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (videoId && !uploading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-primary-light p-3">
        <Film className="size-5 text-brand-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-brand-secondary">
            ვიდეო ატვირთულია
          </p>
          <p className="truncate text-xs text-brand-muted">{videoId}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="size-8 rounded-lg p-0"
        >
          <X className="size-4" />
          <span className="sr-only">წაშლა</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <label
        htmlFor="video-upload"
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
              იტვირთება... {progress}%
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-brand-secondary">
                აირჩიეთ ვიდეო ფაილი
              </p>
              <p className="text-xs text-brand-muted">მაქსიმუმ 2GB</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="video-upload"
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </label>

      {/* Progress bar */}
      {uploading && (
        <div className="h-2 overflow-hidden rounded-full bg-brand-border">
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="size-7 rounded-lg p-0 text-red-700 hover:bg-red-100"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
