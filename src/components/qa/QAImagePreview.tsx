"use client";

import { Expand } from "lucide-react";
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
          <span className="pointer-events-none absolute right-2.5 bottom-2.5 inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
            <Expand className="size-4" />
          </span>
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
