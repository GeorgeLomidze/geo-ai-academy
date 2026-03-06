"use client";

import { useState, useRef } from "react";
import { Upload, X, Film, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type VideoUploaderProps = {
  onUploadComplete: (videoId: string) => void;
  existingVideoId?: string | null;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export function VideoUploader({
  onUploadComplete,
  existingVideoId,
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [bytesTotal, setBytesTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(
    existingVideoId ?? null
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);
    setBytesUploaded(0);
    setBytesTotal(file.size);

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

      const {
        videoId: newVideoId,
        uploadUrl,
        tusHeaders,
        thumbnailUrl: thumb,
      } = await createRes.json();

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
        onProgress(uploaded, total) {
          const pct = Math.round((uploaded / total) * 100);
          setProgress(pct);
          setBytesUploaded(uploaded);
          setBytesTotal(total);
        },
        onSuccess() {
          setVideoId(newVideoId);
          setThumbnailUrl(thumb ?? null);
          setUploading(false);
          setLastFile(null);
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
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

    setLastFile(file);
    uploadFile(file);
  }

  function handleRetry() {
    if (lastFile) {
      uploadFile(lastFile);
    }
  }

  function handleClear() {
    setVideoId(null);
    setThumbnailUrl(null);
    setProgress(0);
    setBytesUploaded(0);
    setBytesTotal(0);
    setError(null);
    setLastFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Completed state — show thumbnail + video ID
  if (videoId && !uploading) {
    return (
      <div className="overflow-hidden rounded-xl border border-brand-border">
        {/* Thumbnail preview */}
        {thumbnailUrl && (
          <div className="relative aspect-video w-full bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt="ვიდეოს გადახედვა"
              className="size-full object-contain"
              onError={(e) => {
                // Bunny may not have generated the thumbnail yet
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-3 bg-brand-primary-light p-3">
          <Film className="size-5 shrink-0 text-brand-primary" />
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
            className="size-8 shrink-0 rounded-lg p-0"
          >
            <X className="size-4" />
            <span className="sr-only">წაშლა</span>
          </Button>
        </div>
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
            <>
              <p className="text-sm font-medium text-brand-primary">
                იტვირთება... {progress}%
              </p>
              <p className="mt-0.5 text-xs text-brand-muted">
                {formatBytes(bytesUploaded)} / {formatBytes(bytesTotal)}
              </p>
            </>
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

      {/* Error with retry */}
      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-danger/20 bg-brand-danger/10 px-3 py-2">
          <p className="min-w-0 text-sm text-brand-danger">{error}</p>
          <div className="flex shrink-0 items-center gap-1">
            {lastFile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-7 rounded-lg px-2 text-xs text-brand-danger hover:bg-brand-danger/10"
              >
                <RotateCcw className="mr-1 size-3" />
                ხელახლა
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null);
                setLastFile(null);
              }}
              className="size-7 rounded-lg p-0 text-brand-danger hover:bg-brand-danger/10"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
