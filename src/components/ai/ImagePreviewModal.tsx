/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { X, Copy, Download, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIHistoryItem } from "@/components/ai/types";

function getPromptPreview(prompt: string | null) {
  if (!prompt) {
    return "პრომპტი არ არის შენახული";
  }

  const sentences = prompt
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return prompt;
  }

  return `${sentences.slice(0, 2).join(" ")}...`;
}

function formatDate(date: Date) {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

interface ImagePreviewModalProps {
  item: AIHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (item: AIHistoryItem) => void;
  onAddReference: (item: AIHistoryItem) => void;
  onDelete: (item: AIHistoryItem) => void;
}

export function ImagePreviewModal({
  item,
  open,
  onOpenChange,
  onDownload,
  onAddReference,
  onDelete,
}: ImagePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopyPrompt() {
    if (!item?.prompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[92dvh] w-[96vw] max-w-[1500px] overflow-hidden rounded-[20px] border border-brand-border bg-[#0A0A0A]">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="size-5" />
        </button>

        {/* Left: Image */}
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0A0A0A] p-6 md:p-10">
          {item.outputUrl ? (
            <img
              src={item.outputUrl}
              alt={item.prompt ?? item.modelName}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-[420px] w-full items-center justify-center rounded-[20px] border border-dashed border-brand-border bg-brand-surface text-sm text-brand-muted">
              სურათი ჯერ მზად არ არის
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex w-[340px] shrink-0 flex-col border-l border-brand-border bg-[#111111] md:w-[380px]">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
            {/* Model + Date */}
            <div>
              <h2 className="text-lg font-semibold text-white">{item.modelName}</h2>
              <p className="mt-1 text-sm text-brand-muted">
                {formatDate(new Date(item.createdAt))}
              </p>
            </div>

            {/* Prompt */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-brand-muted">პრომპტი</p>
                <div className="flex items-center gap-3">
                  {copied ? (
                    <span className="text-xs font-medium text-emerald-400">
                      დაკოპირდა
                    </span>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-brand-border px-3 text-xs"
                    onClick={() => void handleCopyPrompt()}
                  >
                    <Copy className="size-3.5" />
                    კოპირება
                  </Button>
                </div>
              </div>
              <p className="text-pretty text-sm leading-relaxed text-brand-secondary">
                {getPromptPreview(item.prompt)}
              </p>
            </div>

          </div>

          {/* Actions — pinned to bottom */}
          <div className="border-t border-brand-border p-6">
            <div className="flex flex-col gap-3">
              <Button
                className="h-11 w-full rounded-full bg-brand-accent text-sm font-semibold text-black hover:bg-brand-accent-hover"
                disabled={!item.outputUrl}
                onClick={() => onDownload(item)}
              >
                <Download className="size-4" />
                ჩამოტვირთვა
              </Button>
              <Button
                variant="outline"
                className="h-10 w-full rounded-full border-brand-border"
                disabled={!item.outputUrl}
                onClick={() => onAddReference(item)}
              >
                <ImagePlus className="size-4" />
                რეფერენსად დამატება
              </Button>
              <Button
                variant="ghost"
                className="h-10 w-full rounded-full text-brand-muted hover:text-red-400"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="size-4" />
                წაშლა
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
