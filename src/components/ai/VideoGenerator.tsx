"use client"

import { useEffect, useState } from "react"
import { CreditDisplay } from "@/components/ai/CreditDisplay"
import { AIHistoryItem } from "@/components/ai/types"
import { VideoHistory } from "@/components/ai/VideoHistory"
import { VideoSidebar } from "@/components/ai/VideoSidebar"
import { VIDEO_MODELS, getVideoModelCoins, type VideoModelConfig } from "@/lib/credits/pricing"

const VIDEO_MODEL_LIST = Object.entries(VIDEO_MODELS).map(([id, config]) => ({
  id,
  ...config,
}))

type VideoModelEntry = { id: string } & VideoModelConfig

interface VideoGeneratorProps {
  initialBalance: number
  initialGenerations: AIHistoryItem[]
}

type GenerationRequest = {
  model: string
  prompt: string
  startFrameUrl: string | null
  endFrameUrl: string | null
  referenceVideoUrl: string | null
  durationSeconds: number
  aspectRatio: string
  resolution: string
  audio: boolean
  multiShot: boolean
}

function getModelEntry(modelId: string): VideoModelEntry {
  const entry = VIDEO_MODEL_LIST.find((item) => item.id === modelId)
  return entry ?? VIDEO_MODEL_LIST[0]
}

function getCoins(modelId: string, resolution: string, durationSeconds?: number): number {
  return getVideoModelCoins(modelId, resolution, durationSeconds) ?? 0
}

export function VideoGenerator({
  initialBalance,
  initialGenerations,
}: VideoGeneratorProps) {
  const defaultModel = getModelEntry("kling3")
  const [balance, setBalance] = useState(initialBalance)
  const [generations, setGenerations] = useState(initialGenerations)
  const [selectedModel, setSelectedModel] = useState(defaultModel.id)
  const [prompt, setPrompt] = useState("")
  const [startFrameUrl, setStartFrameUrl] = useState<string | null>(null)
  const [endFrameUrl, setEndFrameUrl] = useState<string | null>(null)
  const [referenceVideoUrl, setReferenceVideoUrl] = useState<string | null>(null)
  const [audio, setAudio] = useState(false)
  const [multiShot, setMultiShot] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState(
    Number.parseInt(defaultModel.defaultDuration, 10) || 5
  )
  const [aspectRatio, setAspectRatio] = useState(defaultModel.defaultAspectRatio || "16:9")
  const [resolution, setResolution] = useState(defaultModel.defaultResolution || "720p")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedModelMeta = getModelEntry(selectedModel)
  const currentCoins = getCoins(selectedModel, resolution, durationSeconds)
  const pendingGenerations = generations.filter(
    (item) => item.status === "PENDING" || item.status === "PROCESSING"
  )

  const isMotionControl = selectedModel === "kling3_motion"
  const isKling3 = selectedModel === "kling3"
  const hasKlingFrames = Boolean(startFrameUrl || endFrameUrl)
  // Prompt is optional for: Kling 3 with frames, or Motion Control with both uploads
  const motionControlReady = isMotionControl && Boolean(startFrameUrl) && Boolean(referenceVideoUrl)
  const requiresPrompt = !motionControlReady && (!isKling3 || !hasKlingFrames)

  const canGenerate =
    (!requiresPrompt || Boolean(prompt.trim())) &&
    balance >= currentCoins &&
    !generating &&
    // Standard image-to-video models need startFrameUrl
    (selectedModelMeta.inputMode !== "image" || Boolean(startFrameUrl) || isKling3) &&
    // Motion control needs both character image AND reference video
    (!isMotionControl || (Boolean(startFrameUrl) && Boolean(referenceVideoUrl))) &&
    // Video-to-video disabled (except motion control which uses reference video differently)
    (selectedModelMeta.inputMode !== "video")

  useEffect(() => {
    const meta = selectedModelMeta
    if (meta.aspectRatios.length > 0 && !meta.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(meta.defaultAspectRatio || meta.aspectRatios[0])
    }

    if (meta.resolutions.length > 0 && !meta.resolutions.includes(resolution)) {
      setResolution(meta.defaultResolution || meta.resolutions[0])
    }

    // Validate duration against allowed values
    if (meta.durations.length > 0) {
      const allowed = meta.durations.map((d) => Number.parseInt(d, 10)).filter((n) => !Number.isNaN(n))
      const min = Math.min(...allowed)
      const max = Math.max(...allowed)
      const isDiscrete = allowed.length >= 3
      setDurationSeconds((prev) => {
        if (isDiscrete && !allowed.includes(prev)) {
          return Number.parseInt(meta.defaultDuration, 10) || allowed[0]
        }
        if (!isDiscrete && (prev < min || prev > max)) {
          return Number.parseInt(meta.defaultDuration, 10) || min
        }
        return prev
      })
    }

    if (!meta.supportsMultiShot) {
      setMultiShot(false)
    }

    if (!meta.supportsAudio) {
      setAudio(false)
    }
  }, [aspectRatio, resolution, selectedModelMeta])

  useEffect(() => {
    if (pendingGenerations.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      void Promise.all(
        pendingGenerations.map(async (item) => {
          const response = await fetch(`/api/ai/status/${item.id}`, {
            cache: "no-store",
          })
          const data = (await response.json()) as {
            status?: AIHistoryItem["status"]
            outputUrl?: string | null
            errorMessage?: string | null
          }

          if (!response.ok || !data.status) {
            return
          }

          if (data.status === "FAILED") {
            const balanceResponse = await fetch("/api/credits/balance", {
              cache: "no-store",
            })
            if (balanceResponse.ok) {
              const balanceData = (await balanceResponse.json()) as {
                balance?: number
              }
              if (typeof balanceData.balance === "number") {
                setBalance(balanceData.balance)
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
                  }
                : entry
            )
          )
        })
      )
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [pendingGenerations])

  async function runGeneration(config: GenerationRequest) {
    const model = getModelEntry(config.model)
    const coins = getCoins(config.model, config.resolution, config.durationSeconds)
    const hasFrames = Boolean(config.startFrameUrl || config.endFrameUrl)
    const isMotion = config.model === "kling3_motion"
    const motionReady = isMotion && Boolean(config.startFrameUrl) && Boolean(config.referenceVideoUrl)
    const promptRequired = !motionReady && (config.model !== "kling3" || !hasFrames)

    if (promptRequired && !config.prompt.trim()) {
      setError("პრომპტი აუცილებელია")
      return
    }

    if (model.inputMode === "image" && !config.startFrameUrl && config.model !== "kling3") {
      setError("არჩეული მოდელისთვის საწყისი კადრი აუცილებელია")
      return
    }

    if (isMotion && !config.startFrameUrl) {
      setError("Motion Control-ისთვის პერსონაჟის სურათი აუცილებელია")
      return
    }

    if (isMotion && !config.referenceVideoUrl) {
      setError("Motion Control-ისთვის რეფერენს ვიდეო აუცილებელია")
      return
    }

    if (model.inputMode === "video" && config.model !== "kling3_motion") {
      setError("ამ მოდელს ვიდეოს ატვირთვა სჭირდება")
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          type: "VIDEO",
          prompt: config.prompt,
          imageUrl: config.startFrameUrl ?? undefined,
          endFrameUrl: config.endFrameUrl ?? undefined,
          videoUrl: config.referenceVideoUrl ?? undefined,
          options: {
            duration: `${config.durationSeconds}s`,
            aspectRatio: config.aspectRatio,
            resolution: config.resolution,
            audio: config.audio,
            multiShot: config.multiShot,
          },
        }),
      })

      const data = (await response.json()) as {
        generationId?: string
        status?: AIHistoryItem["status"]
        error?: string
      }

      if (!response.ok || !data.generationId) {
        setError(data.error ?? "ვიდეოს გენერაცია ვერ დაიწყო")
        return
      }

      const nextItem: AIHistoryItem = {
        id: data.generationId,
        modelId: config.model,
        modelName: model.name,
        prompt: config.prompt,
        status: data.status ?? "PROCESSING",
        outputUrl: null,
        creditsUsed: coins,
        createdAt: new Date().toISOString(),
        sourceUrl: config.startFrameUrl,
      }

      setBalance((current) => current - coins)
      setGenerations((current) => [nextItem, ...current])
      setPrompt("")
      if (model.inputMode !== "image") {
        setStartFrameUrl(null)
      }
    } catch {
      setError("ვიდეოს გენერაცია ვერ დაიწყო")
    } finally {
      setGenerating(false)
    }
  }

  function handleGenerate() {
    void runGeneration({
      model: selectedModel,
      prompt,
      startFrameUrl,
      endFrameUrl,
      referenceVideoUrl,
      durationSeconds,
      aspectRatio,
      resolution,
      audio,
      multiShot,
    })
  }

  function handleRerun(item: AIHistoryItem) {
    const model = getModelEntry(item.modelId)
    const nextPrompt = item.prompt ?? ""

    setSelectedModel(model.id)
    setPrompt(nextPrompt)
    setStartFrameUrl(item.sourceUrl)
    setEndFrameUrl(null)
    setReferenceVideoUrl(null)
    setAudio(false)
    setMultiShot(false)
    setDurationSeconds(Number.parseInt(model.defaultDuration, 10) || 5)
    setAspectRatio(model.defaultAspectRatio || "16:9")
    setResolution(model.defaultResolution || "720p")

    if (!nextPrompt) {
      setError("ამ ჩანაწერს პრომპტი არ აქვს შენახული")
      return
    }

    void runGeneration({
      model: model.id,
      prompt: nextPrompt,
      startFrameUrl: item.sourceUrl,
      endFrameUrl: null,
      referenceVideoUrl: null,
      durationSeconds: Number.parseInt(model.defaultDuration, 10) || 5,
      aspectRatio: model.defaultAspectRatio || "16:9",
      resolution: model.defaultResolution || "720p",
      audio: false,
      multiShot: false,
    })
  }

  function handleDelete(id: string) {
    setGenerations((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-brand-background sm:-m-6 lg:-m-8">
      <div className="flex items-center justify-end border-b border-brand-border px-4 py-4 sm:px-6 lg:px-8">
        <CreditDisplay compact balance={balance} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:overflow-hidden lg:px-8 brand-scrollbar">
        <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(320px,30%)_minmax(0,70%)] lg:overflow-hidden">
          <div className="lg:min-h-0">
            <VideoSidebar
              selectedModel={selectedModel}
              models={VIDEO_MODEL_LIST}
              prompt={prompt}
              onPromptChange={setPrompt}
              startFrameUrl={startFrameUrl}
              onStartFrameChange={setStartFrameUrl}
              endFrameUrl={endFrameUrl}
              onEndFrameChange={setEndFrameUrl}
              referenceVideoUrl={referenceVideoUrl}
              onReferenceVideoChange={setReferenceVideoUrl}
              audio={audio}
              onAudioChange={setAudio}
              multiShot={multiShot}
              onMultiShotChange={setMultiShot}
              durationSeconds={durationSeconds}
              onDurationChange={setDurationSeconds}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              resolution={resolution}
              onResolutionChange={setResolution}
              onModelChange={setSelectedModel}
              onGenerate={handleGenerate}
              canGenerate={canGenerate}
              generating={generating}
              error={error}
              currentCoins={currentCoins}
            />
          </div>

          <div className="min-h-0">
            <VideoHistory
              items={generations}
              onRerun={handleRerun}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
