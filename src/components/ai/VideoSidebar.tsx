/* eslint-disable @next/next/no-img-element */
"use client"

import { type ChangeEvent, useRef, useState } from "react"
import {
  ChevronDown,
  ImagePlus,
  Loader2,
  Video,
  X,
} from "lucide-react"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { getVideoModelCoins, type VideoModelConfig } from "@/lib/credits/pricing"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type VideoModelOption = { id: string } & VideoModelConfig

interface VideoSidebarProps {
  selectedModel: string
  models: VideoModelOption[]
  prompt: string
  onPromptChange: (value: string) => void
  startFrameUrl: string | null
  onStartFrameChange: (value: string | null) => void
  endFrameUrl: string | null
  onEndFrameChange: (value: string | null) => void
  referenceVideoUrl: string | null
  onReferenceVideoChange: (value: string | null) => void
  audio: boolean
  onAudioChange: (value: boolean) => void
  multiShot: boolean
  onMultiShotChange: (value: boolean) => void
  durationSeconds: number
  onDurationChange: (value: number) => void
  aspectRatio: string
  onAspectRatioChange: (value: string) => void
  resolution: string
  onResolutionChange: (value: string) => void
  onModelChange: (modelId: string) => void
  onGenerate: () => void
  canGenerate: boolean
  generating: boolean
  error: string | null
  currentCoins: number
}

function ModelUploadCard({
  title,
  description,
  accept,
  disabled = false,
  value,
  onChange,
}: {
  title: string
  description: string
  accept?: string
  disabled?: boolean
  value: string | null
  onChange: (value: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || disabled) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/qa/upload-image", {
        method: "POST",
        credentials: "include",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
        body: formData,
      })

      const data = (await response.json()) as {
        url?: string
        error?: string
        fieldErrors?: {
          file?: string
        }
      }

      if (!response.ok || !data.url) {
        setError(data.fieldErrors?.file ?? data.error ?? "ფაილის ატვირთვა ვერ მოხერხდა")
        return
      }

      onChange(data.url)
    } catch {
      setError("ფაილის ატვირთვა ვერ მოხერხდა")
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const isVideo = accept?.includes("video")

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "rounded-lg border border-brand-border bg-[#101010] p-3",
          disabled && "opacity-60"
        )}
      >
        {value ? (
          <div className="flex items-center gap-3">
            {isVideo ? (
              <video
                src={value}
                muted
                playsInline
                preload="metadata"
                className="size-14 rounded-lg object-cover"
              />
            ) : (
              <img
                src={value}
                alt={title}
                className="size-14 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-brand-secondary">{title}</p>
              <p className="text-xs text-brand-muted text-pretty">{description}</p>
            </div>
            <button
              type="button"
              aria-label={`${title} წაშლა`}
              className="focus-ring inline-flex size-9 items-center justify-center rounded-md border border-brand-border bg-transparent text-brand-muted hover:border-brand-accent/30 hover:text-brand-accent disabled:cursor-not-allowed"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-border px-3 py-4",
              !disabled && "hover:border-brand-accent/30 hover:bg-brand-accent/5",
              disabled && "cursor-not-allowed"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept ?? "image/jpeg,image/png,image/webp,image/avif"}
              className="sr-only"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
            />
            <span className="flex size-11 items-center justify-center rounded-md border border-brand-border bg-brand-surface text-brand-secondary">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isVideo ? (
                <Video className="size-4" />
              ) : (
                <ImagePlus className="size-4" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-brand-secondary">{title}</span>
              <span className="block text-xs text-brand-muted text-pretty">
                {description}
              </span>
            </span>
          </label>
        )}
      </div>

      {error ? <p className="text-xs text-brand-danger">{error}</p> : null}
    </div>
  )
}

export function VideoSidebar({
  selectedModel,
  models,
  prompt,
  onPromptChange,
  startFrameUrl,
  onStartFrameChange,
  endFrameUrl,
  onEndFrameChange,
  referenceVideoUrl,
  onReferenceVideoChange,
  audio,
  onAudioChange,
  multiShot,
  onMultiShotChange,
  durationSeconds,
  onDurationChange,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  onModelChange,
  onGenerate,
  canGenerate,
  generating,
  error,
  currentCoins,
}: VideoSidebarProps) {
  const selected = models.find((item) => item.id === selectedModel) ?? models[0]
  const visibleModels = models.filter((item) => !item.hidden)
  const grouped = visibleModels.reduce<Record<string, VideoModelOption[]>>((acc, item) => {
    acc[item.provider] ??= []
    acc[item.provider].push(item)
    return acc
  }, {})

  // Resolve the "parent" model that owns the variants (for display name in dropdown)
  const parentModel = selected.hidden
    ? models.find((item) => item.variants?.some((v) => v.id === selectedModel))
    : selected
  const displayModel = parentModel ?? selected
  const activeVariants = displayModel.variants

  const needsImage = selected.inputMode === "image"
  const needsVideo = selected.inputMode === "video"
  const isKling3 = selectedModel === "kling3"
  const isMotionControl = selectedModel === "kling3_motion"
  const hasResolutions = selected.resolutions.length > 0
  const hasAspectRatios = selected.aspectRatios.length > 0
  const hasDurations = selected.durations.length > 0

  // Parse duration range from the durations array
  const durationValues = selected.durations
    .map((d) => Number.parseInt(d, 10))
    .filter((n) => !Number.isNaN(n))
  const minDuration = durationValues.length > 0 ? Math.min(...durationValues) : 5
  const maxDuration = durationValues.length > 0 ? Math.max(...durationValues) : 5
  // Use discrete buttons when there are 3+ specific values (not a continuous range)
  const isDiscreteRange = durationValues.length >= 3

  let frameUploadSection: React.ReactNode = null

  if (isKling3) {
    frameUploadSection = (
      <div className="space-y-2">
        <p className="text-xs text-brand-muted">ფრეიმები (არასავალდებულო)</p>
        <div className="grid grid-cols-2 gap-2">
          <ModelUploadCard
            title="საწყისი ფრეიმი"
            description="პირველი კადრი"
            value={startFrameUrl}
            onChange={onStartFrameChange}
          />
          <ModelUploadCard
            title="ბოლო ფრეიმი"
            description="ბოლო კადრი"
            value={endFrameUrl}
            onChange={onEndFrameChange}
          />
        </div>
      </div>
    )
  } else if (isMotionControl) {
    frameUploadSection = (
      <div className="space-y-3">
        <ModelUploadCard
          title="პერსონაჟის სურათი"
          description="პერსონაჟის/ობიექტის ფოტო"
          value={startFrameUrl}
          onChange={onStartFrameChange}
        />
        <ModelUploadCard
          title="რეფერენს ვიდეო"
          description="მოძრაობის რეფერენსი (MP4)"
          accept="video/mp4,video/webm,video/quicktime"
          value={referenceVideoUrl}
          onChange={onReferenceVideoChange}
        />
      </div>
    )
  } else if (needsImage && !isKling3) {
    frameUploadSection = (
      <ModelUploadCard
        title="საწყისი კადრი"
        description="ატვირთე საწყისი კადრი image-to-video რეჟიმისთვის"
        value={startFrameUrl}
        onChange={onStartFrameChange}
      />
    )
  } else if (needsVideo) {
    frameUploadSection = (
      <div className="rounded-lg border border-brand-border bg-[#101010] px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-md border border-brand-border bg-brand-surface text-brand-muted">
            <Video className="size-4" />
          </span>
          <div>
            <p className="text-sm text-brand-secondary">ვიდეო ფაილი საჭიროა</p>
            <p className="mt-1 text-xs text-brand-muted text-pretty">
              ამ მოდელს ვიდეოს ატვირთვა სჭირდება. ატვირთვის მხარდაჭერას შემდეგ ნაბიჯში დავამატებთ.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <aside className="flex h-full flex-col rounded-lg border border-brand-border bg-brand-surface p-4 sm:p-5">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1 brand-scrollbar">
        <div className="space-y-2">
          <p className="text-xs text-brand-muted">მოდელი</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="focus-ring inline-flex h-12 w-full items-center gap-3 rounded-md border border-brand-border bg-[#101010] px-4 text-left text-sm text-brand-secondary hover:border-brand-accent/30"
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-brand-accent/10 text-[11px] font-semibold text-brand-accent">
                  {displayModel.providerMark}
                </span>
                <span className="min-w-0 flex-1 truncate">{displayModel.name}</span>
                <ChevronDown className="size-4 text-brand-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[320px] rounded-lg border-brand-border bg-[#111111] p-2 text-brand-secondary"
            >
              {Object.entries(grouped).map(([provider, providerModels], index) => (
                <div key={provider}>
                  {index > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuLabel className="px-3 py-2 text-xs text-brand-muted">
                    {provider}
                  </DropdownMenuLabel>
                  {providerModels.map((item) => {
                    const baseCoins = getVideoModelCoins(item.id, item.defaultResolution) ?? 0
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onSelect={() => onModelChange(item.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-3 focus:bg-white/5 focus:text-brand-secondary",
                          item.id === selectedModel && "bg-brand-accent/10 text-brand-accent"
                        )}
                      >
                        <span className="flex size-7 items-center justify-center rounded-md bg-brand-accent/10 text-[11px] font-semibold text-brand-accent">
                          {item.providerMark}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.name}</span>
                          <span className="block text-[10px] text-brand-muted">
                            {item.waitTime}
                          </span>
                        </span>
                        <span className="text-xs text-brand-accent tabular-nums">
                          ✦ {baseCoins}+
                        </span>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {activeVariants && activeVariants.length > 1 ? (
            <div className="mt-2 flex gap-2">
              {activeVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                    selectedModel === variant.id
                      ? "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                      : "border-brand-border bg-[#101010] text-brand-muted hover:border-brand-accent/20"
                  )}
                  onClick={() => onModelChange(variant.id)}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {frameUploadSection}

        {selected.supportsMultiShot ? (
          <div className="flex items-center justify-between rounded-lg border border-brand-border bg-[#101010] px-4 py-3">
            <div>
              <p className="text-sm text-brand-secondary">მულტი-შოტი</p>
              <p className="text-xs text-brand-muted">სცენურ რეჟიმს ჩართავს</p>
            </div>
            <Switch
              checked={multiShot}
              onCheckedChange={onMultiShotChange}
              className="data-[state=checked]:bg-brand-accent"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-xs text-brand-muted">პრომპტი</label>
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="აღწერეთ ვიდეო..."
              className="min-h-32 rounded-lg border-brand-border bg-[#101010] px-4 py-3 pr-28 text-sm"
            />
            {selected.supportsAudio ? (
              <button
                type="button"
                aria-label={audio ? "აუდიოს გამორთვა" : "აუდიოს ჩართვა"}
                aria-pressed={audio}
                className={cn(
                  "focus-ring absolute right-3 top-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors",
                  audio
                    ? "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                    : "border-brand-border bg-[#151515] text-brand-muted"
                )}
                onClick={() => onAudioChange(!audio)}
              >
                <span>{audio ? "🔊" : "🔇"}</span>
                <span>აუდიო</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          {hasDurations && isDiscreteRange ? (
            <div>
              <p className="mb-2 text-xs text-brand-muted">ხანგრძლივობა</p>
              <div className="flex flex-wrap gap-2">
                {durationValues.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    className={cn(
                      "rounded-md border border-brand-border bg-[#101010] px-3 py-2 text-sm text-brand-muted transition-colors",
                      dur === durationSeconds && "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                    )}
                    onClick={() => onDurationChange(dur)}
                  >
                    {dur} წმ
                  </button>
                ))}
              </div>
            </div>
          ) : hasDurations && minDuration !== maxDuration ? (
            <div>
              <p className="mb-2 text-xs text-brand-muted">ხანგრძლივობა</p>
              <div className="rounded-lg border border-brand-border bg-[#101010] px-4 py-4">
                <div className="flex items-center justify-between text-sm text-brand-secondary">
                  <span>{minDuration} წმ</span>
                  <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-brand-accent tabular-nums">
                    {durationSeconds} წმ
                  </span>
                  <span>{maxDuration} წმ</span>
                </div>
                <input
                  type="range"
                  min={minDuration}
                  max={maxDuration}
                  step={1}
                  value={durationSeconds}
                  onChange={(event) => onDurationChange(Number(event.target.value))}
                  className="mt-4 h-2 w-full cursor-pointer accent-[#F5A623]"
                />
              </div>
            </div>
          ) : hasDurations ? (
            <div>
              <p className="mb-2 text-xs text-brand-muted">ხანგრძლივობა</p>
              <div className="rounded-lg border border-brand-border bg-[#101010] px-4 py-3 text-sm text-brand-secondary">
                {minDuration} წმ
              </div>
            </div>
          ) : null}

          {hasAspectRatios ? (
            <div>
              <p className="mb-2 text-xs text-brand-muted">პროპორცია</p>
              <div className="flex flex-wrap gap-2">
                {selected.aspectRatios.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      "rounded-md border border-brand-border bg-[#101010] px-3 py-2 text-sm text-brand-muted transition-colors",
                      item === aspectRatio && "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                    )}
                    onClick={() => onAspectRatioChange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {hasResolutions ? (
            <div>
              <p className="mb-2 text-xs text-brand-muted">რეზოლუცია</p>
              <div className="flex flex-wrap gap-2">
                {selected.resolutions.map((res) => {
                  return (
                    <button
                      key={res}
                      type="button"
                      className={cn(
                        "rounded-md border border-brand-border bg-[#101010] px-3 py-2 text-sm text-brand-muted transition-colors",
                        res === resolution && "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                      )}
                      onClick={() => onResolutionChange(res)}
                  >
                    {res}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-brand-border pt-4">
        <Button
          className="h-12 w-full rounded-md bg-brand-accent px-5 text-black hover:bg-brand-accent-hover disabled:bg-brand-accent disabled:text-black/60"
          disabled={!canGenerate || generating}
          onClick={onGenerate}
        >
          {generating ? <Loader2 className="size-4 animate-spin" /> : null}
          გენერაცია ✦ {currentCoins}
        </Button>

        {needsImage && !startFrameUrl && !isKling3 ? (
          <p className="mt-3 text-sm text-brand-muted">
            image-to-video მოდელისთვის საწყისი კადრი აუცილებელია.
          </p>
        ) : null}

        {isMotionControl && !startFrameUrl ? (
          <p className="mt-3 text-sm text-brand-muted">
            Motion Control-ისთვის პერსონაჟის სურათი აუცილებელია.
          </p>
        ) : null}

        {needsVideo && !isMotionControl ? (
          <p className="mt-3 text-sm text-brand-muted">
            ამ მოდელისთვის გენერაცია ვიდეოს ატვირთვამდე გამორთულია.
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-brand-danger">{error}</p> : null}
      </div>
    </aside>
  )
}
