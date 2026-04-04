/* eslint-disable @next/next/no-img-element */
"use client"

import { type ChangeEvent, useRef, useState } from "react"
import {
  ChevronDown,
  ImagePlus,
  Loader2,
  Music,
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
  referenceImageUrls: string[]
  onReferenceImageUrlsChange: (urls: string[]) => void
  referenceAudioUrl: string | null
  onReferenceAudioUrlChange: (url: string | null) => void
  returnLastFrame: boolean
  onReturnLastFrameChange: (value: boolean) => void
  webSearch: boolean
  onWebSearchChange: (value: boolean) => void
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

async function uploadFile(file: File): Promise<string> {
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
    fieldErrors?: { file?: string }
  }

  if (!response.ok || !data.url) {
    throw new Error(data.fieldErrors?.file ?? data.error ?? "ფაილის ატვირთვა ვერ მოხერხდა")
  }

  return data.url
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
    if (!file || disabled) return

    setUploading(true)
    setError(null)

    try {
      const url = await uploadFile(file)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ფაილის ატვირთვა ვერ მოხერხდა")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
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

// ─── Small upload box used in Seedance 2.0 horizontal row ───────────────────

function SmallUploadBox({
  label,
  accept,
  value,
  onUpload,
  onRemove,
  disabled,
  isAudio,
  isVideo: isVideoBox,
}: {
  label: string
  accept?: string
  value: string | null
  onUpload: (url: string) => void
  onRemove: () => void
  disabled?: boolean
  isAudio?: boolean
  isVideo?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || disabled) return

    setUploading(true)
    setError(null)

    try {
      const url = await uploadFile(file)
      onUpload(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ფაილის ატვირთვა ვერ მოხერხდა")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {value ? (
          <div className="group relative size-18 rounded-md overflow-hidden border border-brand-accent/30">
            {isVideoBox ? (
              <video
                src={value}
                muted
                playsInline
                preload="metadata"
                className="size-full object-cover"
              />
            ) : isAudio ? (
              <div className="flex size-full items-center justify-center bg-[#1A1A1A]">
                <Music className="size-5 text-brand-accent" />
              </div>
            ) : (
              <img src={value} alt={label} className="size-full object-cover" />
            )}
            <button
              type="button"
              aria-label="წაშლა"
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <X className="size-4 text-white" />
            </button>
          </div>
        ) : (
          <label
            className={cn(
              "flex size-18 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-brand-border bg-[#101010] transition-colors",
              !disabled && "hover:border-brand-accent/40 hover:bg-brand-accent/5",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept ?? "image/jpeg,image/png,image/webp"}
              className="sr-only"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
            />
            {uploading ? (
              <Loader2 className="size-4 animate-spin text-brand-muted" />
            ) : isVideoBox ? (
              <Video className="size-4 text-brand-muted" />
            ) : isAudio ? (
              <Music className="size-4 text-brand-muted" />
            ) : (
              <ImagePlus className="size-4 text-brand-muted" />
            )}
          </label>
        )}
      </div>
      <span className="text-[10px] text-brand-muted text-center leading-tight max-w-18">{label}</span>
      {error ? <p className="text-[10px] text-brand-danger">{error}</p> : null}
    </div>
  )
}

// ─── Seedance 2.0 reference images dynamic upload row ────────────────────────

function SeedanceReferenceImages({
  urls,
  onChange,
}: {
  urls: string[]
  onChange: (urls: string[]) => void
}) {
  const MAX_IMAGES = 9
  const showNewBox = urls.length < MAX_IMAGES

  function handleUpload(index: number, url: string) {
    const next = [...urls]
    next[index] = url
    onChange(next)
  }

  function handleRemove(index: number) {
    const next = urls.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url, i) => (
        <SmallUploadBox
          key={`ref-img-${i}`}
          label={`სურათი ${i + 1}`}
          value={url}
          onUpload={(newUrl) => handleUpload(i, newUrl)}
          onRemove={() => handleRemove(i)}
        />
      ))}
      {showNewBox ? (
        <SmallUploadBox
          key={`ref-img-new`}
          label="სურათი"
          value={null}
          onUpload={(url) => handleUpload(urls.length, url)}
          onRemove={() => {}}
        />
      ) : null}
    </div>
  )
}

// ─── Seedance 2.0 prompt with @ mention support ──────────────────────────────

function SeedancePromptField({
  value,
  onChange,
  referenceImageUrls,
  audio,
  onAudioChange,
}: {
  value: string
  onChange: (v: string) => void
  referenceImageUrls: string[]
  audio: boolean
  onAudioChange: (v: boolean) => void
}) {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionAtIndex, setMentionAtIndex] = useState(0)
  const [mentionSearch, setMentionSearch] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const val = event.target.value
    onChange(val)

    const cursorPos = event.target.selectionStart ?? val.length
    const textBeforeCursor = val.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.slice(lastAtIndex + 1)
      const hasSpace = afterAt.includes(" ") || afterAt.includes("\n")
      if (!hasSpace && referenceImageUrls.length > 0) {
        setMentionSearch(afterAt)
        setMentionAtIndex(lastAtIndex)
        setShowMentionDropdown(true)
        return
      }
    }
    setShowMentionDropdown(false)
  }

  function insertMention(imageIndex: number) {
    const georgianName = `@სურათი${imageIndex + 1}`
    const cursorPos = textareaRef.current?.selectionStart ?? value.length
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    const before = value.slice(0, lastAtIndex)
    const afterCursor = value.slice(cursorPos)
    const next = `${before}${georgianName} ${afterCursor}`
    onChange(next)
    setShowMentionDropdown(false)
    // Restore focus
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = before.length + georgianName.length + 1
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  const filteredImages = referenceImageUrls.filter((_, i) => {
    const label = `სურათი${i + 1}`
    return label.toLowerCase().includes(mentionSearch.toLowerCase()) || mentionSearch === ""
  })

  return (
    <div className="space-y-2">
      <label className="text-xs text-brand-muted">პრომპტი</label>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setShowMentionDropdown(false), 150)}
          placeholder="აღწერეთ ვიდეო..."
          className="min-h-32 rounded-lg border-brand-border bg-[#101010] px-4 py-3 pr-28 text-sm"
        />
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

        {showMentionDropdown && filteredImages.length > 0 ? (
          <div className="absolute bottom-full left-0 z-50 mb-1 w-48 rounded-md border border-brand-border bg-brand-surface-light py-1 shadow-lg">
            {filteredImages.map((url, i) => {
              const realIndex = referenceImageUrls.indexOf(url)
              return (
                <button
                  key={`mention-${realIndex}`}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-secondary hover:bg-brand-accent/10 hover:text-brand-accent"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertMention(realIndex)
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    className="size-6 rounded object-cover"
                  />
                  <span>სურათი {realIndex + 1}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
      {referenceImageUrls.length > 0 ? (
        <p className="text-[10px] text-brand-muted">
          @ — სარეფერენო სურათის ჩასასმელად
        </p>
      ) : null}
    </div>
  )
}

// ─── Main Seedance 2.0 panel ─────────────────────────────────────────────────

function Seedance2Panel({
  startFrameUrl,
  onStartFrameChange,
  endFrameUrl,
  onEndFrameChange,
  referenceImageUrls,
  onReferenceImageUrlsChange,
  referenceVideoUrl,
  onReferenceVideoChange,
  referenceAudioUrl,
  onReferenceAudioUrlChange,
  webSearch,
  onWebSearchChange,
  prompt,
  onPromptChange,
  audio,
  onAudioChange,
  durationSeconds,
  onDurationChange,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  aspectRatios,
  resolutions,
}: {
  startFrameUrl: string | null
  onStartFrameChange: (v: string | null) => void
  endFrameUrl: string | null
  onEndFrameChange: (v: string | null) => void
  referenceImageUrls: string[]
  onReferenceImageUrlsChange: (urls: string[]) => void
  referenceVideoUrl: string | null
  onReferenceVideoChange: (v: string | null) => void
  referenceAudioUrl: string | null
  onReferenceAudioUrlChange: (v: string | null) => void
  webSearch: boolean
  onWebSearchChange: (v: boolean) => void
  prompt: string
  onPromptChange: (v: string) => void
  audio: boolean
  onAudioChange: (v: boolean) => void
  durationSeconds: number
  onDurationChange: (v: number) => void
  aspectRatio: string
  onAspectRatioChange: (v: string) => void
  resolution: string
  onResolutionChange: (v: string) => void
  aspectRatios: string[]
  resolutions: string[]
}) {
  return (
    <div className="space-y-3">
      {/* Start / End frame — Kling style */}
      <div className="rounded-lg border border-brand-border bg-[#0D0D0D] p-3">
        <p className="mb-3 text-xs text-brand-muted">კადრები (არასავალდებულო)</p>
        <div className="grid grid-cols-2 gap-2">
          <ModelUploadCard
            title="საწყისი კადრი"
            description="პირველი კადრი"
            value={startFrameUrl}
            onChange={onStartFrameChange}
          />
          <ModelUploadCard
            title="ბოლო კადრი"
            description="ბოლო კადრი"
            value={endFrameUrl}
            onChange={onEndFrameChange}
          />
        </div>
      </div>

      {/* Reference images (dynamic) */}
      <div className="rounded-lg border border-brand-border bg-[#0D0D0D] p-3">
        <p className="mb-3 text-xs text-brand-muted">
          რეფ. სურათები ({referenceImageUrls.length}/9)
        </p>
        <SeedanceReferenceImages
          urls={referenceImageUrls}
          onChange={onReferenceImageUrlsChange}
        />
      </div>

      {/* Reference video */}
      <div className="rounded-lg border border-brand-border bg-[#0D0D0D] p-3">
        <p className="mb-3 text-xs text-brand-muted">რეფ. ვიდეო</p>
        <SmallUploadBox
          label="ვიდეო"
          accept="video/mp4,video/webm,video/quicktime"
          value={referenceVideoUrl}
          onUpload={onReferenceVideoChange}
          onRemove={() => onReferenceVideoChange(null)}
          isVideo
        />
      </div>

      {/* Reference audio */}
      <div className="rounded-lg border border-brand-border bg-[#0D0D0D] p-3">
        <p className="mb-3 text-xs text-brand-muted">რეფ. აუდიო</p>
        <SmallUploadBox
          label="აუდიო"
          accept="audio/wav,audio/mpeg,audio/mp3"
          value={referenceAudioUrl}
          onUpload={onReferenceAudioUrlChange}
          onRemove={() => onReferenceAudioUrlChange(null)}
          isAudio
        />
      </div>

      {/* Prompt with @ mention */}
      <SeedancePromptField
        value={prompt}
        onChange={onPromptChange}
        referenceImageUrls={referenceImageUrls}
        audio={audio}
        onAudioChange={onAudioChange}
      />

      {/* Duration slider 4-15s */}
      <div>
        <p className="mb-2 text-xs text-brand-muted">ხანგრძლივობა</p>
        <div className="rounded-lg border border-brand-border bg-[#101010] px-4 py-4">
          <div className="flex items-center justify-between text-sm text-brand-secondary">
            <span>4 წმ</span>
            <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-brand-accent tabular-nums">
              {durationSeconds} წმ
            </span>
            <span>15 წმ</span>
          </div>
          <input
            type="range"
            min={4}
            max={15}
            step={1}
            value={durationSeconds}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="mt-4 h-2 w-full cursor-pointer accent-[#FFD60A]"
          />
        </div>
      </div>

      {/* Aspect ratio */}
      <div>
        <p className="mb-2 text-xs text-brand-muted">პროპორცია</p>
        <div className="flex flex-wrap gap-2">
          {aspectRatios.map((ar) => (
            <button
              key={ar}
              type="button"
              className={cn(
                "rounded-md border border-brand-border bg-[#101010] px-3 py-2 text-sm text-brand-muted transition-colors",
                ar === aspectRatio && "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
              )}
              onClick={() => onAspectRatioChange(ar)}
            >
              {ar}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution */}
      <div>
        <p className="mb-2 text-xs text-brand-muted">რეზოლუცია</p>
        <div className="flex flex-wrap gap-2">
          {resolutions.map((res) => (
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
          ))}
        </div>
      </div>

      {/* Web search toggle */}
      <div className="flex items-center justify-between rounded-lg border border-brand-border bg-[#101010] px-4 py-3">
        <div>
          <p className="text-sm text-brand-secondary">ვებ-ძიება</p>
          <p className="text-xs text-brand-muted">ვებ-ძიების ჩართვა გენერაციისთვის</p>
        </div>
        <Switch
          checked={webSearch}
          onCheckedChange={onWebSearchChange}
          className="data-[state=checked]:bg-brand-accent"
        />
      </div>
    </div>
  )
}

// ─── Main VideoSidebar component ─────────────────────────────────────────────

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
  referenceImageUrls,
  onReferenceImageUrlsChange,
  referenceAudioUrl,
  onReferenceAudioUrlChange,
  returnLastFrame,
  onReturnLastFrameChange,
  webSearch,
  onWebSearchChange,
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
  const isMotionControl = selectedModel === "kling3_motion"
  const isSeedance2 = selectedModel === "seedance2" || selectedModel === "seedance2fast"
  const supportsFirstLastFrames = Boolean(selected.supportsFirstLastFrames)
  const hasResolutions = selected.resolutions.length > 0
  const hasAspectRatios = selected.aspectRatios.length > 0
  const hasDurations = selected.durations.length > 0
  const usesDurationSlider = Boolean(selected.usesDurationSlider) || selectedModel === "kling3"

  // Duration values are explicit allowed options from model config.
  const durationValues = selected.durations
    .map((d) => Number.parseInt(d, 10))
    .filter((n) => !Number.isNaN(n))
  const minDuration = durationValues.length > 0 ? Math.min(...durationValues) : 3
  const maxDuration = durationValues.length > 0 ? Math.max(...durationValues) : 15

  let frameUploadSection: React.ReactNode = null

  if (isSeedance2) {
    frameUploadSection = (
      <Seedance2Panel
        startFrameUrl={startFrameUrl}
        onStartFrameChange={onStartFrameChange}
        endFrameUrl={endFrameUrl}
        onEndFrameChange={onEndFrameChange}
        referenceImageUrls={referenceImageUrls}
        onReferenceImageUrlsChange={onReferenceImageUrlsChange}
        referenceVideoUrl={referenceVideoUrl}
        onReferenceVideoChange={onReferenceVideoChange}
        referenceAudioUrl={referenceAudioUrl}
        onReferenceAudioUrlChange={onReferenceAudioUrlChange}
        webSearch={webSearch}
        onWebSearchChange={onWebSearchChange}
        prompt={prompt}
        onPromptChange={onPromptChange}
        audio={audio}
        onAudioChange={onAudioChange}
        durationSeconds={durationSeconds}
        onDurationChange={onDurationChange}
        aspectRatio={aspectRatio}
        onAspectRatioChange={onAspectRatioChange}
        resolution={resolution}
        onResolutionChange={onResolutionChange}
        aspectRatios={selected.aspectRatios}
        resolutions={selected.resolutions}
      />
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
  } else if (supportsFirstLastFrames) {
    frameUploadSection = (
      <div className="space-y-2">
        <p className="text-xs text-brand-muted">კადრები (არასავალდებულო)</p>
        <div className="grid grid-cols-2 gap-2">
          <ModelUploadCard
            title="საწყისი კადრი"
            description="პირველი კადრი"
            value={startFrameUrl}
            onChange={onStartFrameChange}
          />
          <ModelUploadCard
            title="ბოლო კადრი"
            description="ბოლო კადრი"
            value={endFrameUrl}
            onChange={onEndFrameChange}
          />
        </div>
      </div>
    )
  } else if (needsImage) {
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
        {/* Model selector */}
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

        {/* Upload section / model-specific panel */}
        {frameUploadSection}

        {/* Generic controls (hidden for Seedance 2.0 which renders its own) */}
        {!isSeedance2 ? (
          <>
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
              {hasDurations && usesDurationSlider ? (
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
                      className="mt-4 h-2 w-full cursor-pointer accent-[#FFD60A]"
                    />
                  </div>
                </div>
              ) : hasDurations ? (
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
          </>
        ) : null}
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

        {needsImage && !startFrameUrl && !supportsFirstLastFrames && !isSeedance2 ? (
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
