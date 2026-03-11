"use client";

import { Expand, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QAImagePreviewProps {
  src: string;
  alt: string;
}

export function QAImagePreview({ src, alt }: QAImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative overflow-hidden rounded-2xl border border-brand-border bg-brand-background/70 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01]"
          aria-label="სურათის გადიდება"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-28 w-auto max-w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-3 py-2 text-xs text-white">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="size-3.5" />
              სურათი
            </span>
            <span className="inline-flex items-center gap-1.5 text-white/85">
              გადიდება
              <Expand className="size-3.5" />
            </span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-white/10 bg-[#111111] p-3 sm:p-5">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[78dvh] w-auto max-w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
