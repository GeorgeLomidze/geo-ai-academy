"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { CreditDisplay } from "@/components/ai/CreditDisplay";
import { ImageGrid } from "@/components/ai/ImageGrid";
import { ImagePreviewModal } from "@/components/ai/ImagePreviewModal";
import { PromptBar } from "@/components/ai/PromptBar";
import { AIHistoryItem } from "@/components/ai/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getModelPrice } from "@/lib/credits/pricing";

const MODEL_OPTIONS = [
  {
    id: "nanobananapro",
    name: "Nano Banana Pro",
    coins: 36,
    provider: "Google",
    providerMark: "G",
  },
  {
    id: "nanobanana2",
    name: "Nano Banana 2",
    coins: 12,
    provider: "Google",
    providerMark: "G",
  },
  {
    id: "nanobanana",
    name: "Nano Banana",
    coins: 6,
    provider: "Google",
    providerMark: "G",
  },
  {
    id: "seedream5lite",
    name: "Seedream 5.0 Lite",
    coins: 15,
    provider: "ByteDance",
    providerMark: "B",
  },
  {
    id: "grok_t2i",
    name: "Grok Imagine",
    coins: 9,
    provider: "xAI",
    providerMark: "x",
  },
  {
    id: "openaiimage",
    name: "GPT Image",
    coins: 12,
    provider: "OpenAI",
    providerMark: "O",
  },
  {
    id: "flux",
    name: "Flux",
    coins: 15,
    provider: "Black Forest Labs",
    providerMark: "B",
  },
] as const;

/**
 * Per-model resolution/quality options shown in the UI dropdown.
 * Values are mapped to the correct API parameter in normalizeImageInputOptions.
 * - Nano Banana: no resolution param
 * - Nano Banana 2 / Pro: `resolution` — "1K" | "2K" | "4K"
 * - Seedream 5 Lite: `quality` — "basic" (2K) | "high" (4K), shown as 2K/4K
 * - Grok / GPT Image / Flux: no resolution param
 */
const QUALITY_OPTIONS: Record<string, string[]> = {
  nanobanana2: ["1K", "2K", "4K"],
  nanobananapro: ["1K", "2K", "4K"],
  seedream5lite: ["2K", "4K"],
};

const DEFAULT_QUALITY_OPTIONS: string[] = [];

/**
 * Per-model aspect ratio options from KIE API docs.
 * Each array lists ONLY the values the model actually accepts.
 */
const ASPECT_RATIO_OPTIONS: Record<string, readonly string[]> = {
  // image_size param — 11 values
  nanobanana: ["1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  // aspect_ratio param — 15 values (includes 1:4, 1:8, 4:1, 8:1 which are extreme)
  nanobanana2: ["1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  // aspect_ratio param — 11 values
  nanobananapro: ["1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  // aspect_ratio param — 8 values (no 4:5, 5:4)
  seedream5lite: ["1:1", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  // aspect_ratio param — 5 values only
  grok_t2i: ["1:1", "3:2", "2:3", "16:9", "9:16"],
  // size param — 3 values only
  openaiimage: ["1:1", "3:2", "2:3"],
  // aspectRatio param — 6 values
  flux: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"],
};

const DEFAULT_ASPECT_RATIOS: readonly string[] = [
  "1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9",
];

const SOURCE_IMAGE_MODEL_MAP = {
  nanobanana: "nanobanana_edit",
  nanobanana2: "nanobanana2_edit",
  nanobananapro: "nanobananapro_edit",
  seedream5lite: "seedream5lite_edit",
  grok_t2i: "grok_i2i",
  openaiimage: "openaiimage",
  flux: "flux",
} as const;

function createTemporaryGenerationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `temp-${crypto.randomUUID()}`;
  }

  return `temp-${Date.now()}`;
}

function resolveImageModel(model: string, hasSourceImage: boolean) {
  if (!hasSourceImage) {
    return model;
  }

  return SOURCE_IMAGE_MODEL_MAP[model as keyof typeof SOURCE_IMAGE_MODEL_MAP] ?? model;
}

interface ImageGeneratorProps {
  initialBalance: number;
  initialGenerations: AIHistoryItem[];
}

export function ImageGenerator({
  initialBalance,
  initialGenerations,
}: ImageGeneratorProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [generations, setGenerations] = useState(initialGenerations);
  const [selectedModel, setSelectedModel] = useState<string>("nanobananapro");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [quality, setQuality] = useState("4K");
  const [imageCount, setImageCount] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<AIHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTargets, setDeleteTargets] = useState<AIHistoryItem[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const selectedModelMeta =
    MODEL_OPTIONS.find((item) => item.id === selectedModel) ?? MODEL_OPTIONS[0];
  const qualityOptions = QUALITY_OPTIONS[selectedModel] ?? DEFAULT_QUALITY_OPTIONS;
  const aspectRatioOptions = ASPECT_RATIO_OPTIONS[selectedModel] ?? DEFAULT_ASPECT_RATIOS;
  const selectedCoinCost = getModelPrice(selectedModel, quality) ?? selectedModelMeta.coins;
  const totalCoinCost = selectedCoinCost * imageCount;
  const primaryImageUrl = imageUrls[0] ?? null;
  const pendingGenerations = generations.filter(
    (item) =>
      (item.status === "PENDING" || item.status === "PROCESSING") &&
      !item.id.startsWith("temp-")
  );
  const selectedItems = generations.filter((item) => selectedIds.includes(item.id));

  useEffect(() => {
    if (!qualityOptions.includes(quality)) {
      setQuality(qualityOptions[qualityOptions.length - 1] ?? "1K");
    }
  }, [quality, qualityOptions]);

  useEffect(() => {
    if (!aspectRatioOptions.includes(aspectRatio)) {
      setAspectRatio(aspectRatioOptions[0] ?? "1:1");
    }
  }, [aspectRatio, aspectRatioOptions]);

  useEffect(() => {
    if (pendingGenerations.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void Promise.all(
        pendingGenerations.map(async (item) => {
          const response = await fetch(`/api/ai/status/${item.id}`, {
            cache: "no-store",
          });
          const data = (await response.json()) as {
            status?: AIHistoryItem["status"];
            outputUrl?: string | null;
            errorMessage?: string | null;
          };

          if (!response.ok || !data.status) {
            return;
          }

          if (data.status === "FAILED") {
            const balanceResponse = await fetch("/api/credits/balance", {
              cache: "no-store",
            });
            if (balanceResponse.ok) {
              const balanceData = (await balanceResponse.json()) as {
                balance?: number;
              };
              if (typeof balanceData.balance === "number") {
                setBalance(balanceData.balance);
              }
            }
          }

          setGenerations((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    status: data.status ?? entry.status,
                    outputUrl: data.outputUrl ?? entry.outputUrl,
                    errorMessage: data.errorMessage ?? entry.errorMessage ?? null,
                  }
                : entry
            )
          );
        })
      );
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [pendingGenerations]);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => generations.some((item) => item.id === id)),
    );
  }, [generations]);

  async function requestImageGeneration(input: {
    temporaryId: string;
    model: string;
    promptValue: string;
    aspectRatioValue: string;
    qualityValue: string;
    primaryImageUrlValue: string | null;
  }) {
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: input.model,
          type: "IMAGE",
          prompt: input.promptValue,
          imageUrl: input.primaryImageUrlValue ?? undefined,
          options: {
            aspectRatio: input.aspectRatioValue,
            quality: input.qualityValue,
          },
        }),
      });

      const data = (await response.json()) as {
        generationId?: string;
        status?: AIHistoryItem["status"];
        error?: string;
      };

      if (!response.ok || !data.generationId) {
        setGenerations((current) =>
          current.map((entry) =>
            entry.id === input.temporaryId
              ? {
                  ...entry,
                  status: "FAILED",
                  errorMessage: data.error ?? "გენერაცია ვერ შესრულდა",
                }
              : entry
          )
        );
        return false;
      }

      setGenerations((current) =>
        current.map((entry) =>
          entry.id === input.temporaryId
            ? {
                ...entry,
                id: data.generationId!,
                status: data.status ?? "PROCESSING",
              }
            : entry
        )
      );

      return true;
    } catch {
      setGenerations((current) =>
        current.map((entry) =>
          entry.id === input.temporaryId
            ? {
                ...entry,
                status: "FAILED",
                errorMessage: "გენერაცია ვერ შესრულდა",
              }
            : entry
        )
      );
      return false;
    }
  }

  async function handleGenerate() {
    const promptValue = prompt.trim();

    if (!promptValue) {
      setError("პრომპტი აუცილებელია");
      return;
    }

    setGenerating(true);
    setError(null);
    const temporaryId = createTemporaryGenerationId();

    try {
      const model = resolveImageModel(selectedModel, Boolean(primaryImageUrl));
      const generationCoinCost = getModelPrice(model, quality) ?? selectedCoinCost;
      const tempItems = Array.from({ length: imageCount }, (_, index) => ({
        id: index === 0 ? temporaryId : createTemporaryGenerationId(),
        modelId: selectedModel,
        modelName: selectedModelMeta.name,
        prompt: promptValue,
        aspectRatio,
        status: "PROCESSING" as const,
        outputUrl: null,
        errorMessage: null,
        creditsUsed: generationCoinCost,
        createdAt: new Date(Date.now() + index).toISOString(),
        sourceUrl: primaryImageUrl,
      }));

      setGenerations((current) => [...tempItems, ...current]);

      const results: boolean[] = [];

      for (const item of tempItems) {
        results.push(
          await requestImageGeneration({
            temporaryId: item.id,
            model,
            promptValue,
            aspectRatioValue: aspectRatio,
            qualityValue: quality,
            primaryImageUrlValue: primaryImageUrl,
          })
        );
      }

      const successfulGenerations = results.filter(Boolean).length;
      const failedGenerations = results.length - successfulGenerations;

      if (successfulGenerations > 0) {
        setBalance((current) => current - generationCoinCost * successfulGenerations);
        setPrompt("");
      }

      if (failedGenerations > 0) {
        setError(
          failedGenerations === results.length
            ? "გენერაცია ვერ შესრულდა"
            : `${failedGenerations} სურათის გენერაცია ვერ შესრულდა`
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload(item: AIHistoryItem) {
    if (!item.outputUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = item.outputUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = `${item.modelId}-${item.id}.png`;
    link.click();
  }

  function handleAddReference(item: AIHistoryItem) {
    if (!item.outputUrl) {
      return;
    }

    if (imageUrls.includes(item.outputUrl)) {
      setError("ეს სურათი უკვე დამატებულია რეფერენსებში");
      return;
    }

    if (imageUrls.length >= 10) {
      setError("მაქსიმუმ 10 სურათის დამატებაა შესაძლებელი");
      return;
    }

    setImageUrls((current) => [...current, item.outputUrl!]);
    setError(null);
  }

  async function handleDeleteMany(items: AIHistoryItem[]) {
    if (items.length === 0) {
      return;
    }

    let failedCount = 0;

    for (const item of items) {
      if (item.id.startsWith("temp-")) {
        setGenerations((current) => current.filter((entry) => entry.id !== item.id));
        setPreviewItem((current) => (current?.id === item.id ? null : current));
        continue;
      }

      try {
        const response = await fetch(`/api/ai/${item.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          failedCount += 1;
          continue;
        }

        setGenerations((current) => current.filter((entry) => entry.id !== item.id));
        setPreviewItem((current) => (current?.id === item.id ? null : current));
      } catch {
        failedCount += 1;
      }
    }

    setSelectedIds((current) => current.filter((id) => !items.some((item) => item.id === id)));

    if (failedCount > 0) {
      setError(
        failedCount === items.length
          ? "გენერაციის წაშლა ვერ მოხერხდა"
          : `${failedCount} სურათის წაშლა ვერ მოხერხდა`,
      );
    }
  }

  function handleToggleSelect(item: AIHistoryItem) {
    if (item.status === "PROCESSING" || item.status === "PENDING") {
      return;
    }

    setSelectedIds((current) =>
      current.includes(item.id)
        ? current.filter((id) => id !== item.id)
        : [...current, item.id],
    );
  }

  function requestDelete(items: AIHistoryItem[]) {
    if (items.length === 0) {
      return;
    }

    setDeleteTargets(items);
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    const targets = deleteTargets;
    setConfirmDeleteOpen(false);
    setDeleteTargets([]);
    await handleDeleteMany(targets);
  }

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-brand-background sm:-m-6 lg:-m-8">
      <div className="flex flex-1 flex-col overflow-hidden px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="flex min-h-0 flex-1 flex-col border-b border-brand-border pb-4">
          <div className="mt-4 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            <div className="mb-4 flex items-end justify-end">
              <CreditDisplay compact balance={balance} />
            </div>

            {selectedItems.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-brand-surface px-4 py-3">
                <p className="text-sm text-brand-secondary">
                  მონიშნულია {selectedItems.length} სურათი
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedIds([])}
                  >
                    <X className="size-4" />
                    გასუფთავება
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    onClick={() => requestDelete(selectedItems)}
                  >
                    <Trash2 className="size-4" />
                    მონიშნულების წაშლა
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
              <ImageGrid
                items={generations}
                selectedIds={selectedIds}
                onPreview={setPreviewItem}
                onDownload={handleDownload}
                onAddReference={handleAddReference}
                onDeleteRequest={(item) => requestDelete([item])}
                onToggleSelect={handleToggleSelect}
              />
            </div>
          </div>
        </div>
      </div>

      <PromptBar
        prompt={prompt}
        onPromptChange={setPrompt}
        selectedModel={selectedModel}
        models={[...MODEL_OPTIONS]}
        onModelChange={setSelectedModel}
        aspectRatio={aspectRatio}
        aspectRatioOptions={[...aspectRatioOptions]}
        onAspectRatioChange={setAspectRatio}
        quality={quality}
        qualityOptions={qualityOptions}
        onQualityChange={setQuality}
        imageCount={imageCount}
        onImageCountChange={setImageCount}
        imageUrls={imageUrls}
        onImageUrlsChange={setImageUrls}
        coinCost={totalCoinCost}
        canGenerate={
          prompt.trim().length > 0 && !generating
        }
        onGenerate={() => void handleGenerate()}
        generating={generating}
        error={error}
        onErrorClear={() => setError(null)}
      />

      <ImagePreviewModal
        key={previewItem?.id ?? "image-preview-closed"}
        item={previewItem}
        open={previewItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
          }
        }}
        onDownload={handleDownload}
        onAddReference={handleAddReference}
        onDelete={(item) => requestDelete([item])}
      />

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-brand-border bg-brand-surface text-brand-secondary">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTargets.length > 1
                ? "მონიშნული სურათების წაშლა"
                : "სურათის წაშლა"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-brand-muted">
              {deleteTargets.length > 1
                ? `ნამდვილად გსურს ${deleteTargets.length} მონიშნული სურათის წაშლა? ეს მოქმედება ვეღარ დაბრუნდება.`
                : "ნამდვილად გსურს ამ სურათის წაშლა? ეს მოქმედება ვეღარ დაბრუნდება."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-brand-border">
              გაუქმება
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
