"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, FileIcon, Loader2 } from "lucide-react";
import type { ProjectNodeData } from "../types";

interface UploadNodeProps {
  data: ProjectNodeData;
  onDataChange: (data: Partial<ProjectNodeData>) => void;
}

export function UploadNode({ data, onDataChange }: UploadNodeProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  async function normalizeImageForUpload(file: File) {
    const objectUrl = URL.createObjectURL(file);

    try {
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          const img = new window.Image();
          img.onload = () =>
            resolve({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          img.onerror = () => reject(new Error("სურათის დამუშავება ვერ მოხერხდა"));
          img.src = objectUrl;
        }
      );

      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("სურათის დამუშავება ვერ მოხერხდა");
      }

      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("სურათის დამუშავება ვერ მოხერხდა"));
        img.src = objectUrl;
      });

      context.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (value) {
            resolve(value);
            return;
          }
          reject(new Error("სურათის დამუშავება ვერ მოხერხდა"));
        }, "image/png");
      });

      const nextName = file.name.replace(/\.[^.]+$/, "") || "upload";

      return {
        file: new File([blob], `${nextName}.png`, { type: "image/png" }),
        width: dimensions.width,
        height: dimensions.height,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    let previewUrl: string | null = null;

    try {
      // Normalize image uploads to PNG so downstream video models get a stable format.
      const isImage = file.type.startsWith("image/");
      let uploadFile = file;
      let imageWidth: number | undefined;
      let imageHeight: number | undefined;

      if (isImage) {
        const normalized = await normalizeImageForUpload(file);
        uploadFile = normalized.file;
        imageWidth = normalized.width;
        imageHeight = normalized.height;

        if (localPreview) {
          URL.revokeObjectURL(localPreview);
        }
        previewUrl = URL.createObjectURL(uploadFile);
        setLocalPreview(previewUrl);
      }

      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          body?.errors?.file ?? body?.error ?? "ატვირთვა ვერ მოხერხდა";
        throw new Error(msg);
      }

      const { url } = await res.json();
      onDataChange({
        fileName: uploadFile.name,
        fileUrl: url,
        fileType: uploadFile.type,
        imageWidth,
        imageHeight,
      });
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setLocalPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ატვირთვა ვერ მოხერხდა");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const isImage = data.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i);
  const displayUrl = data.fileUrl ?? localPreview;

  // Uploading state with local preview
  if (uploading) {
    return (
      <div
        className="relative flex size-full items-center justify-center"
        data-node-interactive=""
      >
        {localPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={localPreview}
            alt="ატვირთვა..."
            className="absolute inset-0 size-full object-cover opacity-40"
            draggable={false}
          />
        )}
        <div className="z-10 flex flex-col items-center gap-2">
          <Loader2 className="size-6 animate-spin text-brand-accent" />
          <span className="text-xs text-white/50">იტვირთება...</span>
        </div>
      </div>
    );
  }

  // Uploaded file preview
  if (displayUrl && data.fileName) {
    return isImage ? (
      <div className="relative size-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt={data.fileName}
          className="size-full object-cover"
          draggable={false}
        />
      </div>
    ) : (
      <div className="flex size-full flex-col items-center justify-center gap-2">
        <FileIcon className="size-8 text-white/30" />
        <span className="max-w-[80%] truncate px-2 text-xs text-white/50">
          {data.fileName}
        </span>
      </div>
    );
  }

  // Empty / drop zone
  return (
    <div
      className={`flex size-full cursor-pointer flex-col items-center justify-center gap-2 transition-colors ${
        dragging ? "bg-brand-accent/5" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <Upload className="size-6 text-white/20" />
      <p className="text-xs text-white/30">ჩააგდე ან ატვირთე</p>
      <button
        type="button"
        data-node-interactive=""
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        ატვირთვა
      </button>
      {error && (
        <p className="max-w-[90%] text-center text-[10px] text-red-400">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
