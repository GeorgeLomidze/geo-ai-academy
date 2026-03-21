"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Film,
  Loader2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type VideoStatus = "uploading" | "processing" | "ready" | "failed" | "idle";

type VideoUploaderProps = {
  onUploadComplete: (videoId: string) => void;
  onProcessingChange?: (processing: boolean) => void;
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
  onProcessingChange,
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
  const [videoStatus, setVideoStatus] = useState<VideoStatus>(
    existingVideoId ? "ready" : "idle"
  );
  const [encodeProgress, setEncodeProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for video processing status
  useEffect(() => {
    if (!videoId || videoStatus !== "processing") {
      return;
    }

    onProcessingChange?.(true);

    async function checkStatus() {
      try {
        const res = await fetch(`/api/admin/video-status/${videoId}`);
        if (!res.ok) return;

        const data = await res.json();
        setEncodeProgress(data.encodeProgress ?? 0);

        if (data.status === "ready") {
          setVideoStatus("ready");
          onProcessingChange?.(false);
          onUploadComplete(videoId!);
        } else if (data.status === "failed") {
          setVideoStatus("failed");
          onProcessingChange?.(false);
          setError("ვიდეოს დამუშავება ვერ მოხერხდა");
        }
      } catch {
        // Ignore poll errors, retry on next interval
      }
    }

    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      onProcessingChange?.(false);
    };
  }, [videoId, videoStatus, onProcessingChange, onUploadComplete]);

  // Check status on mount for existing videos that might still be processing
  useEffect(() => {
    if (!existingVideoId || videoStatus !== "ready") return;

    let cancelled = false;

    async function checkExisting() {
      try {
        const res = await fetch(
          `/api/admin/video-status/${existingVideoId}`
        );
        if (!res.ok || cancelled) return;

        const data = await res.json();
        if (cancelled) return;

        if (data.status === "processing") {
          setVideoStatus("processing");
        } else if (data.status === "failed") {
          setVideoStatus("failed");
          setError("ვიდეოს დამუშავება ვერ მოხერხდა");
        }
      } catch {
        // Ignore
      }
    }

    checkExisting();

    return () => {
      cancelled = true;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);
    setVideoStatus("uploading");
    setProgress(0);
    setBytesUploaded(0);
    setBytesTotal(file.size);

    try {
      const createRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(createData.error ?? "ვიდეოს შექმნა ვერ მოხერხდა");
        setUploading(false);
        setVideoStatus("idle");
        return;
      }

      const {
        videoId: newVideoId,
        uploadUrl,
        tusHeaders,
        thumbnailUrl: thumb,
      } = createData;

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
          // Don't call onUploadComplete yet — start polling for processing
          setVideoStatus("processing");
        },
        onError() {
          setError("ვიდეოს ატვირთვა ვერ მოხერხდა");
          setUploading(false);
          setVideoStatus("idle");
        },
      });

      upload.start();
    } catch {
      setError("ვიდეოს ატვირთვა ვერ მოხერხდა");
      setUploading(false);
      setVideoStatus("idle");
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
    setVideoStatus("idle");
    setEncodeProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Processing state
  if (videoId && videoStatus === "processing") {
    return (
      <div className="overflow-hidden rounded-xl border border-brand-border">
        <div className="flex flex-col items-center gap-3 bg-brand-primary-light/50 p-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-primary/10">
            <Loader2 className="size-6 animate-spin text-brand-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-brand-primary">
              ვიდეო მუშავდება... გთხოვთ მოიცადოთ
            </p>
            {encodeProgress > 0 && (
              <p className="mt-1 text-xs text-brand-muted">
                პროგრესი: {encodeProgress}%
              </p>
            )}
          </div>
          <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-brand-border">
            <div className="h-full animate-pulse rounded-full bg-brand-primary" />
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-brand-border bg-brand-surface p-3">
          <Film className="size-5 shrink-0 text-brand-muted" />
          <p className="min-w-0 flex-1 truncate text-xs text-brand-muted">
            {videoId}
          </p>
        </div>
      </div>
    );
  }

  // Failed state
  if (videoId && videoStatus === "failed") {
    return (
      <div className="overflow-hidden rounded-xl border border-brand-danger/20">
        <div className="flex flex-col items-center gap-3 bg-brand-danger/5 p-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-danger/10">
            <AlertTriangle className="size-6 text-brand-danger" />
          </div>
          <p className="text-sm font-medium text-brand-danger">
            ვიდეოს დამუშავება ვერ მოხერხდა
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="rounded-xl gap-2 border-brand-danger/20 text-brand-danger hover:bg-brand-danger/10"
          >
            <RotateCcw className="size-3.5" />
            ხელახლა ატვირთვა
          </Button>
        </div>
      </div>
    );
  }

  // Completed/ready state
  if (videoId && !uploading && videoStatus === "ready") {
    return (
      <div className="overflow-hidden rounded-xl border border-brand-border">
        {thumbnailUrl && (
          <div className="relative aspect-video w-full bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt="ვიდეოს გადახედვა"
              className="size-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-3 bg-brand-primary-light p-3">
          <CheckCircle2 className="size-5 shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-brand-secondary">
              ვიდეო მზადაა!
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
