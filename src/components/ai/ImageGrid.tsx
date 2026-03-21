/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIHistoryItem } from "@/components/ai/types";

interface ImageGridProps {
  items: AIHistoryItem[];
  onPreview: (item: AIHistoryItem) => void;
  onDownload: (item: AIHistoryItem) => void;
  onAddReference: (item: AIHistoryItem) => void;
  onDelete: (item: AIHistoryItem) => void;
}

function toAspectRatioNumber(value?: string | null) {
  if (!value || !value.includes(":")) {
    return 1;
  }

  const [width, height] = value.split(":").map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 1;
  }

  return width / height;
}

function getGridConfig(containerWidth: number) {
  if (containerWidth >= 1680) {
    return { columns: 12, rowHeight: 24 };
  }

  if (containerWidth >= 1400) {
    return { columns: 10, rowHeight: 24 };
  }

  if (containerWidth >= 1100) {
    return { columns: 8, rowHeight: 24 };
  }

  if (containerWidth >= 768) {
    return { columns: 6, rowHeight: 22 };
  }

  return { columns: 2, rowHeight: 18 };
}

function getTileSpans(aspectRatio: number, containerWidth: number) {
  const gap = 12;
  const { columns, rowHeight } = getGridConfig(containerWidth);
  const columnWidth =
    (containerWidth - gap * Math.max(columns - 1, 0)) / columns;
  const maxColumnSpan =
    aspectRatio >= 1.6
      ? Math.min(columns, columns >= 10 ? 4 : 3)
      : Math.min(columns, columns >= 10 ? 3 : 2);

  const desiredWidth = Math.min(
    columnWidth * maxColumnSpan,
    aspectRatio >= 1.6 ? columnWidth * 3 : columnWidth * 2.2
  );
  const desiredHeight = Math.min(
    desiredWidth / Math.max(aspectRatio, 0.1),
    columnWidth * 3.5
  );

  const columnSpan = Math.max(
    1,
    Math.min(maxColumnSpan, Math.round((desiredWidth + gap) / (columnWidth + gap)))
  );
  const rowSpan = Math.max(
    4,
    Math.round((desiredHeight + gap) / (rowHeight + gap))
  );

  const width = columnSpan * columnWidth + gap * (columnSpan - 1);

  return {
    columnSpan,
    rowSpan,
    width,
  };
}

export function ImageGrid({
  items,
  onPreview,
  onDownload,
  onAddReference,
  onDelete,
}: ImageGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[40dvh] flex-col items-center justify-center rounded-[28px] border border-dashed border-brand-border bg-brand-surface px-6 text-center">
        <p className="text-xl text-brand-secondary">ისტორია ჯერ ცარიელია</p>
        <p className="mt-2 max-w-md text-sm text-brand-muted">
          აღწერე სასურველი კადრი ქვემოთ და შენი პირველი გენერაცია აქ გამოჩნდება.
        </p>
      </div>
    );
  }

  const safeContainerWidth = containerWidth > 0 ? containerWidth : 1200;
  const { columns, rowHeight } = getGridConfig(safeContainerWidth);

  return (
    <div
      ref={containerRef}
      className="grid grid-flow-dense gap-3"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `${rowHeight}px`,
      }}
    >
      {items.map((item) => {
        const isReady = item.status === "SUCCEEDED" && item.outputUrl;
        const isFailed = item.status === "FAILED" || item.status === "CANCELED";
        const aspectRatio = toAspectRatioNumber(item.aspectRatio);
        const tileSpans = getTileSpans(aspectRatio, safeContainerWidth);
        const columnSpan = tileSpans.columnSpan;
        const rowSpan = tileSpans.rowSpan;
        const width = tileSpans.width;
        const compactActions = width < 320;

        return (
          <article
            key={item.id}
            style={{
              gridColumn: `span ${columnSpan}`,
              gridRow: `span ${rowSpan}`,
            }}
            className="group relative overflow-hidden border border-brand-border bg-brand-surface"
          >
                <button
                  type="button"
                  className="h-full w-full text-left"
                  onClick={() => {
                    if (item.outputUrl) {
                      onPreview(item);
                    }
                  }}
                >
                  {item.outputUrl ? (
                    <div className="flex h-full w-full items-center justify-center bg-[#090909]">
                      <img
                        src={item.outputUrl}
                        alt={item.prompt ?? item.modelName}
                        className="h-full w-full object-contain transition duration-200"
                      />
                    </div>
                  ) : isFailed ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0f0f0f] px-5 text-center text-brand-muted">
                      <AlertCircle className="size-7 text-red-400" />
                      <div>
                        <p className="text-sm text-brand-secondary">გენერაცია ვერ შესრულდა</p>
                        <p className="mt-1 line-clamp-3 max-w-[28ch] text-xs text-brand-muted">
                          {item.errorMessage ?? "Kie.ai-ზე მოთხოვნა ვერ დასრულდა"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#0f0f0f] px-5 text-center text-brand-muted">
                      <div className="relative flex size-20 items-center justify-center rounded-full border border-brand-accent/25 bg-brand-accent/10">
                        <span className="absolute inset-0 rounded-full border border-brand-accent/20 animate-ping" />
                        <span className="relative text-4xl leading-none animate-pulse">📷</span>
                      </div>
                      <div className="flex items-center gap-2 text-brand-accent">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm text-brand-secondary">მიმდინარეობს გენერაცია</span>
                      </div>
                      <p className="max-w-[26ch] text-xs text-brand-muted">
                        შედეგი აქ ავტომატურად გამოჩნდება, როგორც კი დასრულდება დამუშავება.
                      </p>
                    </div>
                  )}
                </button>

                <div className="pointer-events-none absolute inset-0 bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 border-t border-black/10 bg-brand-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                    compactActions ? "px-2 py-2" : "flex items-center px-4 py-3"
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-auto",
                      compactActions
                        ? "grid grid-cols-3 gap-2 justify-items-center"
                        : "flex gap-2"
                    )}
                  >
                    <button
                      type="button"
                      aria-label="ჩამოტვირთვა"
                      className={cn(
                        "focus-ring inline-flex items-center justify-center rounded-full border border-black/10 bg-black/10 text-black disabled:cursor-not-allowed disabled:opacity-40",
                        compactActions ? "size-9" : "size-10"
                      )}
                      onClick={() => onDownload(item)}
                      disabled={!isReady}
                    >
                      <Download className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="რეფერენსად დამატება"
                      className={cn(
                        "focus-ring inline-flex items-center justify-center rounded-full border border-black/10 bg-black/10 text-black disabled:cursor-not-allowed disabled:opacity-40",
                        compactActions ? "size-9" : "size-10"
                      )}
                      onClick={() => onAddReference(item)}
                      disabled={!isReady}
                    >
                      <ImagePlus className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="წაშლა"
                      className={cn(
                        "focus-ring inline-flex items-center justify-center rounded-full border border-black/10 bg-black/10 text-black",
                        compactActions ? "size-9" : "size-10"
                      )}
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="absolute left-4 top-4 flex items-center gap-2">
                  {item.status === "PROCESSING" || item.status === "PENDING" ? (
                    <span className="rounded-full border border-white/10 bg-black/80 px-3 py-1 text-xs text-white">
                      მუშავდება
                    </span>
                  ) : null}
                  {isFailed ? (
                    <span className="rounded-full border border-red-500/30 bg-black/80 px-3 py-1 text-xs text-red-400">
                      შეცდომა
                    </span>
                  ) : null}
                </div>
          </article>
        );
      })}
    </div>
  );
}
