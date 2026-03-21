"use client";

import { useEffect, useState } from "react";
import { CreditDisplay } from "@/components/ai/CreditDisplay";
import { ImageGrid } from "@/components/ai/ImageGrid";
import { ImagePreviewModal } from "@/components/ai/ImagePreviewModal";
import { PromptBar } from "@/components/ai/PromptBar";
import { AIHistoryItem } from "@/components/ai/types";
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

  const selectedModelMeta =
    MODEL_OPTIONS.find((item) => item.id === selectedModel) ?? MODEL_OPTIONS[0];
  const qualityOptions = QUALITY_OPTIONS[selectedModel] ?? DEFAULT_QUALITY_OPTIONS;
  const aspectRatioOptions = ASPECT_RATIO_OPTIONS[selectedModel] ?? DEFAULT_ASPECT_RATIOS;
  const selectedCoinCost = getModelPrice(selectedModel, quality) ?? selectedModelMeta.coins;
  const primaryImageUrl = imageUrls[0] ?? null;
  const pendingGenerations = generations.filter(
    (item) =>
      (item.status === "PENDING" || item.status === "PROCESSING") &&
      !item.id.startsWith("temp-")
  );

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

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("პრომპტი აუცილებელია");
      return;
    }

    setGenerating(true);
    setError(null);
    const temporaryId = createTemporaryGenerationId();

    try {
      const model = resolveImageModel(selectedModel, Boolean(primaryImageUrl));
      const generationCoinCost = getModelPrice(model, quality) ?? selectedCoinCost;
      const startedAt = new Date().toISOString();

      setGenerations((current) => [
        {
          id: temporaryId,
          modelId: selectedModel,
          modelName: selectedModelMeta.name,
          prompt,
          aspectRatio,
          status: "PROCESSING",
          outputUrl: null,
          errorMessage: null,
          creditsUsed: generationCoinCost,
          createdAt: startedAt,
          sourceUrl: primaryImageUrl,
        },
        ...current,
      ]);

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          type: "IMAGE",
          prompt,
          imageUrl: primaryImageUrl ?? undefined,
          options: {
            aspectRatio,
            quality,
            imageCount,
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
            entry.id === temporaryId
              ? {
                  ...entry,
                  status: "FAILED",
                  errorMessage: data.error ?? "გენერაცია ვერ შესრულდა",
                }
              : entry
          )
        );
        return;
      }

      setBalance((current) => current - generationCoinCost);
      setGenerations((current) => [
        ...current.map((entry) =>
          entry.id === temporaryId
            ? {
                ...entry,
                id: data.generationId!,
                status: data.status ?? "PROCESSING",
              }
            : entry
        ),
      ]);
      setPrompt("");
    } catch {
      setGenerations((current) =>
        current.map((entry) =>
          entry.id === temporaryId
            ? {
                ...entry,
                status: "FAILED",
                errorMessage: "გენერაცია ვერ შესრულდა",
              }
            : entry
        )
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleCopyPrompt(value: string | null) {
    if (!value) {
      return;
    }

    void navigator.clipboard.writeText(value);
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

  async function handleDelete(item: AIHistoryItem) {
    if (item.id.startsWith("temp-")) {
      setGenerations((current) => current.filter((entry) => entry.id !== item.id));
      setPreviewItem((current) => (current?.id === item.id ? null : current));
      return;
    }

    try {
      const response = await fetch(`/api/ai/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("გენერაციის წაშლა ვერ მოხერხდა");
        return;
      }

      setGenerations((current) => current.filter((entry) => entry.id !== item.id));
      setPreviewItem((current) => (current?.id === item.id ? null : current));
    } catch {
      setError("გენერაციის წაშლა ვერ მოხერხდა");
    }
  }

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-brand-background sm:-m-6 lg:-m-8">
      <div className="flex flex-1 flex-col overflow-hidden px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="flex min-h-0 flex-1 flex-col border-b border-brand-border pb-4">
          <div className="mt-4 flex min-h-0 flex-1 w-full flex-col overflow-hidden">
            <div className="mb-4 flex items-end justify-end">
              <CreditDisplay compact balance={balance} />
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
              <ImageGrid
                items={generations}
                onPreview={setPreviewItem}
                onDownload={handleDownload}
                onAddReference={handleAddReference}
                onDelete={(item) => void handleDelete(item)}
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
        coinCost={selectedCoinCost}
        canGenerate={
          prompt.trim().length > 0 && !generating
        }
        onGenerate={() => void handleGenerate()}
        generating={generating}
        error={error}
        onErrorClear={() => setError(null)}
      />

      <ImagePreviewModal
        item={previewItem}
        open={previewItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
          }
        }}
        onCopyPrompt={handleCopyPrompt}
        onDownload={handleDownload}
        onAddReference={handleAddReference}
        onDelete={(item) => void handleDelete(item)}
      />
    </div>
  );
}
