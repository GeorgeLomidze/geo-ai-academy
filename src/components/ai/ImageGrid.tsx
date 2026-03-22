/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Download, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIHistoryItem } from "@/components/ai/types";

interface ImageGridProps {
  items: AIHistoryItem[];
  selectedIds: string[];
  onPreview: (item: AIHistoryItem) => void;
  onDownload: (item: AIHistoryItem) => void;
  onAddReference: (item: AIHistoryItem) => void;
  onDeleteRequest: (item: AIHistoryItem) => void;
  onToggleSelect: (item: AIHistoryItem) => void;
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
    aspectRatio >= 1.6 ? columnWidth * 4.15 : columnWidth * 3.05
  );
  const desiredHeight = Math.min(
    desiredWidth / Math.max(aspectRatio, 0.1),
    columnWidth * 4.8
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
  selectedIds,
  onPreview,
  onDownload,
  onAddReference,
  onDeleteRequest,
  onToggleSelect,
}: ImageGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});

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
        const canSelect = item.status !== "PROCESSING" && item.status !== "PENDING";
        const isSelected = selectedIds.includes(item.id);
        const aspectRatio = imageAspectRatios[item.id] ?? toAspectRatioNumber(item.aspectRatio);
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
              ...(isReady ? { justifySelf: "start", alignSelf: "start" } : {}),
            }}
            className={cn(
              "group relative",
              isReady
                ? "overflow-visible border-none bg-transparent"
                : "border border-brand-border bg-brand-surface",
            )}
          >
                {canSelect ? (
                  <button
                    type="button"
                    aria-label={isSelected ? "მონიშვნის მოხსნა" : "მონიშვნა"}
                    className="focus-ring absolute left-4 top-4 z-20 inline-flex items-center justify-center text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleSelect(item);
                    }}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md border-2 transition-all duration-200",
                        isSelected
                          ? "border-brand-accent bg-brand-accent text-black"
                          : "border-white/90 bg-transparent text-transparent hover:border-brand-accent",
                      )}
                    >
                      <Check className="size-3.5" />
                    </span>
                  </button>
                ) : null}

                <div
                  role={item.outputUrl ? "button" : undefined}
                  tabIndex={item.outputUrl ? 0 : undefined}
                  className={cn(
                    "text-left",
                    isReady ? "inline-flex items-start justify-start" : "h-full w-full",
                    item.outputUrl && "cursor-pointer focus:outline-none",
                  )}
                  onClick={() => {
                    if (item.outputUrl) {
                      onPreview(item);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!item.outputUrl) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onPreview(item);
                    }
                  }}
                >
                  {item.outputUrl ? (
                    <div className="relative inline-flex h-auto max-w-full">
                        <img
                          src={item.outputUrl}
                          alt={item.prompt ?? item.modelName}
                          className="block h-auto max-h-full w-auto max-w-full object-contain transition duration-200"
                          onLoad={(event) => {
                            const target = event.currentTarget;
                            if (target.naturalWidth > 0 && target.naturalHeight > 0) {
                              const nextRatio = target.naturalWidth / target.naturalHeight;
                              setImageAspectRatios((current) =>
                                current[item.id] === nextRatio
                                  ? current
                                  : { ...current, [item.id]: nextRatio },
                              );
                            }
                          }}
                        />

                        <div className="pointer-events-none absolute inset-0">
                          <div
                            className={cn(
                              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2",
                              compactActions ? "right-2" : "right-3",
                            )}
                          >
                            <div
                              className={cn(
                                "pointer-events-auto",
                                compactActions
                                  ? "flex flex-col gap-3"
                                  : "flex flex-col gap-4",
                              )}
                            >
                              <button
                                type="button"
                                aria-label="ჩამოტვირთვა"
                                className={cn(
                                  "focus-ring inline-flex items-center justify-center rounded-full border border-white/75 bg-black/34 text-white shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-brand-accent hover:bg-brand-accent hover:text-black hover:shadow-[0_0_28px_rgba(255,214,10,0.36)] disabled:cursor-not-allowed disabled:opacity-40",
                                  compactActions ? "size-9" : "size-10",
                                )}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDownload(item);
                                }}
                                disabled={!isReady}
                              >
                                <Download className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="რეფერენსად დამატება"
                                className={cn(
                                  "focus-ring inline-flex items-center justify-center rounded-full border border-white/75 bg-black/34 text-white shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-brand-accent hover:bg-brand-accent hover:text-black hover:shadow-[0_0_28px_rgba(255,214,10,0.36)] disabled:cursor-not-allowed disabled:opacity-40",
                                  compactActions ? "size-9" : "size-10",
                                )}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onAddReference(item);
                                }}
                                disabled={!isReady}
                              >
                                <ImagePlus className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="წაშლა"
                                className={cn(
                                  "focus-ring inline-flex items-center justify-center rounded-full border border-white/75 bg-black/34 text-white shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-brand-accent hover:bg-brand-accent hover:text-black hover:shadow-[0_0_28px_rgba(255,214,10,0.36)]",
                                  compactActions ? "size-9" : "size-10",
                                )}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDeleteRequest(item);
                                }}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                        </div>
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
                </div>

                {!isReady ? (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </>
                ) : null}

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
