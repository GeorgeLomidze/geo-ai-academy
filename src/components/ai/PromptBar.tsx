/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, ImagePlus, Loader2, Minus, Plus, X } from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModelSelectorPill, type ImageModelOption } from "@/components/ai/ModelSelectorPill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

interface PromptBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedModel: string;
  models: ImageModelOption[];
  onModelChange: (value: string) => void;
  aspectRatio: string;
  aspectRatioOptions: string[];
  onAspectRatioChange: (value: string) => void;
  quality: string;
  qualityOptions: string[];
  onQualityChange: (value: string) => void;
  imageCount: number;
  onImageCountChange: (value: number) => void;
  imageUrls: string[];
  onImageUrlsChange: Dispatch<SetStateAction<string[]>>;
  coinCost: number;
  canGenerate: boolean;
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
  onErrorClear?: () => void;
}

type PillDropdownOption = {
  value: string;
  label: string;
};

interface PillDropdownProps {
  value: string;
  options: PillDropdownOption[];
  onChange: (value: string) => void;
  triggerClassName?: string;
}

function PillDropdown({
  value,
  options,
  onChange,
  triggerClassName,
}: PillDropdownProps) {
  const selected = options.find((item) => item.value === value) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus-ring inline-flex h-11 items-center justify-between gap-3 rounded-full border border-brand-accent/20 bg-[#171717] px-4 text-sm text-brand-secondary transition-colors hover:border-brand-accent/45 hover:bg-[#1b1b1b]",
            triggerClassName
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">{selected.label}</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-brand-muted" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="end"
        className={cn(
          "w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)] rounded-3xl border border-brand-accent/20 bg-[#111111] p-2 text-brand-secondary"
        )}
      >
        {options.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onSelect={() => onChange(item.value)}
            className={cn(
              "flex items-center rounded-2xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary",
              item.value === value && "bg-brand-accent/10 text-brand-accent"
            )}
          >
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PromptBar({
  prompt,
  onPromptChange,
  selectedModel,
  models,
  onModelChange,
  aspectRatio,
  aspectRatioOptions,
  onAspectRatioChange,
  quality,
  qualityOptions,
  onQualityChange,
  imageCount,
  onImageCountChange,
  imageUrls,
  onImageUrlsChange,
  coinCost,
  canGenerate,
  onGenerate,
  generating,
  error,
  onErrorClear,
}: PromptBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const maxImages = 10;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 28;
    const maxHeight = Math.round(lineHeight * 5 + 16);
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [prompt]);

  useEffect(() => {
    if (!uploadError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setUploadError(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [uploadError]);

  useEffect(() => {
    if (!error || !onErrorClear) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onErrorClear();
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [error, onErrorClear]);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const remainingSlots = maxImages - imageUrls.length;
    if (remainingSlots <= 0) {
      setUploadError("მაქსიმუმ 10 სურათის ატვირთვაა შესაძლებელი");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const supabase = createSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uploadedUrls: string[] = [];

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

        const data = (await response.json()) as {
          url?: string;
          error?: string;
          fieldErrors?: {
            file?: string;
          };
        };

        if (!response.ok || !data.url) {
          setUploadError(
            data.fieldErrors?.file ?? data.error ?? "სურათის ატვირთვა ვერ მოხერხდა"
          );
          return;
        }

        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        onImageUrlsChange((current) => [...current, ...uploadedUrls]);
      }

      if (files.length > remainingSlots) {
        setUploadError("მაქსიმუმ 10 სურათის ატვირთვაა შესაძლებელი");
      }
    } catch {
      setUploadError("სურათის ატვირთვა ვერ მოხერხდა");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleRemoveImage(imageUrl: string) {
    onImageUrlsChange((current) =>
      current.filter((currentUrl) => currentUrl !== imageUrl)
    );
    setUploadError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="sticky bottom-0 z-40 border-t border-brand-border bg-brand-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 rounded-[30px] border border-brand-border bg-[#111111] p-3 shadow-sm">
        {imageUrls.length > 0 ? (
          <div className="flex flex-wrap gap-2 px-1">
            {imageUrls.map((imageUrl, index) => (
              <div key={`${imageUrl}-${index}`} className="relative">
                <img
                  src={imageUrl}
                  alt={`ატვირთული საცნობარო სურათი ${index + 1}`}
                  className="size-16 rounded-2xl border border-brand-border object-cover"
                />
                <button
                  type="button"
                  aria-label="სურათის წაშლა"
                  className="focus-ring absolute -right-2 -top-2 inline-flex size-7 items-center justify-center rounded-full border border-brand-border bg-[#111111] text-brand-secondary transition-colors hover:border-brand-accent hover:text-brand-accent"
                  onClick={() => handleRemoveImage(imageUrl)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="flex min-w-0 items-start gap-3 rounded-[24px] border border-brand-border bg-[#171717] px-3 py-3.5">
              <label className="shrink-0">
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={handleFileSelect}
                  disabled={uploading || imageUrls.length >= maxImages}
                />
                <span
                  className={cn(
                    "focus-ring inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-brand-accent/25 bg-brand-accent/10 text-brand-accent transition-colors hover:border-brand-accent hover:bg-brand-accent/15",
                    (uploading || imageUrls.length >= maxImages) && "cursor-wait opacity-60"
                  )}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                </span>
              </label>

              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                placeholder="აღწერეთ სურათი..."
                rows={1}
                className="min-h-[3rem] flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-0 py-1.5 text-base leading-7 text-brand-secondary shadow-none focus-visible:ring-0"
              />
            </div>

            <Button
              className="h-16 rounded-[24px] bg-brand-accent px-7 text-black shadow-sm transition-colors hover:bg-brand-accent-hover disabled:bg-brand-accent/80 disabled:text-black/70 xl:min-w-[190px]"
              disabled={!canGenerate || generating}
              onClick={onGenerate}
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              გენერაცია ✦ {coinCost}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ModelSelectorPill
              value={selectedModel}
              options={models}
              onChange={onModelChange}
            />

            <PillDropdown
              value={aspectRatio}
              options={aspectRatioOptions.map((ratio) => ({ value: ratio, label: ratio }))}
              onChange={onAspectRatioChange}
              triggerClassName="w-[108px]"
            />

            {qualityOptions.length > 0 ? (
              <PillDropdown
                value={quality}
                options={qualityOptions.map((item) => ({ value: item, label: item }))}
                onChange={onQualityChange}
                triggerClassName="w-[92px]"
              />
            ) : null}

            <div className="flex h-11 w-[138px] items-center gap-2 rounded-full border border-brand-accent/20 bg-[#171717] px-2">
              <button
                type="button"
                aria-label="სურათების რაოდენობის შემცირება"
                className="focus-ring inline-flex size-8 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-brand-accent/10 hover:text-brand-accent"
                onClick={() => onImageCountChange(Math.max(1, imageCount - 1))}
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-10 text-center text-sm text-brand-secondary tabular-nums">
                {imageCount}/4
              </span>
              <button
                type="button"
                aria-label="სურათების რაოდენობის გაზრდა"
                className="focus-ring inline-flex size-8 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-brand-accent/10 hover:text-brand-accent"
                onClick={() => onImageCountChange(Math.min(4, imageCount + 1))}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {uploadError ? (
          <p className="px-2 text-sm text-brand-danger">
            {uploadError}
          </p>
        ) : error ? (
          <p className="px-2 text-sm text-brand-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
