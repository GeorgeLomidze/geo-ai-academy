"use client"

import { useRef, useState } from "react"
import { Copy, Download, Info, Loader2, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AIHistoryItem } from "@/components/ai/types"

interface VideoPlayerProps {
  item: AIHistoryItem | null
  onDownload: (item: AIHistoryItem) => void
  onCopyLink: (item: AIHistoryItem) => void
}

export function VideoPlayer({
  item,
  onDownload,
  onCopyLink,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (!item) {
    return (
      <section className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[30px] border border-dashed border-brand-border bg-brand-surface px-6 text-center">
        <Sparkles className="size-10 text-brand-accent" />
        <h2 className="mt-5 text-2xl text-brand-secondary text-balance">
          ვიდეო სტუდია მზად არის
        </h2>
        <p className="mt-3 max-w-xl text-sm text-brand-muted text-pretty">
          მარცხენა პანელში აღწერე სასურველი სცენა, აირჩიე მოდელი და პირველი ვიდეო აქ გამოჩნდება.
        </p>
      </section>
    )
  }

  const isPending = item.status === "PENDING" || item.status === "PROCESSING"
  const isFailed = item.status === "FAILED"
  const isReady = item.status === "SUCCEEDED" && item.outputUrl

  async function handlePlay() {
    if (!videoRef.current) {
      return
    }

    try {
      await videoRef.current.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  return (
    <>
      <section className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[30px] border border-brand-border bg-brand-surface">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-brand-muted">ვიდეო გენერაცია</p>
            <h2 className="truncate text-lg text-brand-secondary">{item.modelName}</h2>
          </div>
          <div className="rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs text-brand-accent tabular-nums">
            ✦ {item.creditsUsed}
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center bg-[#090909] p-4 sm:p-6">
          {isPending ? (
            <div className="flex max-w-md flex-col items-center text-center">
              <Loader2 className="size-10 animate-spin text-brand-accent" />
              <h3 className="mt-5 text-2xl text-brand-secondary text-balance">
                ვიდეო მზადდება...
              </h3>
            </div>
          ) : null}

          {isFailed ? (
            <div className="max-w-md rounded-[26px] border border-brand-border bg-[#101010] px-6 py-7 text-center">
              <h3 className="text-xl text-brand-secondary text-balance">
                ვიდეოს გენერაცია ვერ დასრულდა
              </h3>
              <p className="mt-3 text-sm text-brand-muted text-pretty">
                სცადე სხვა მოდელი ან ოდნავ შეცვლილი პრომპტი. თუ გენერაცია წარუმატებელი იყო, კრედიტები ავტომატურად ბრუნდება.
              </p>
            </div>
          ) : null}

          {isReady ? (
            <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-black">
              <video
                ref={videoRef}
                src={item.outputUrl ?? undefined}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />

              {!playing ? (
                <button
                  type="button"
                  aria-label="ვიდეოს გაშვება"
                  className="focus-ring absolute inset-0 flex items-center justify-center bg-black/20"
                  onClick={() => void handlePlay()}
                >
                  <span className="flex size-20 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg">
                    <Play className="ml-1 size-8" />
                  </span>
                </button>
              ) : null}

              <div className="absolute right-4 top-4 flex flex-col gap-2">
                <button
                  type="button"
                  aria-label="ჩამოტვირთვა"
                  className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white"
                  onClick={() => onDownload(item)}
                >
                  <Download className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="ბმულის კოპირება"
                  className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white"
                  onClick={() => onCopyLink(item)}
                >
                  <Copy className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="დეტალების ნახვა"
                  className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white"
                  onClick={() => setDetailsOpen(true)}
                >
                  <Info className="size-4" />
                </button>
              </div>

              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/80 px-3 py-1 text-xs text-white">
                  {new Date(item.createdAt).toLocaleDateString("ka-GE")}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border-brand-border bg-[#0f0f0f] text-brand-secondary">
          <DialogHeader className="text-left">
            <DialogTitle>{item.modelName}</DialogTitle>
            <DialogDescription className="text-brand-muted">
              {new Date(item.createdAt).toLocaleString("ka-GE")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-[22px] border border-brand-border bg-brand-surface p-4">
              <p className="mb-2 text-xs text-brand-muted">პრომპტი</p>
              <p className="leading-6 text-brand-secondary">
                {item.prompt ?? "პრომპტი არ არის შენახული"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-brand-border bg-brand-surface p-4">
                <p className="text-xs text-brand-muted">სტატუსი</p>
                <p className="mt-1 text-sm text-brand-secondary">{item.status}</p>
              </div>
              <div className="rounded-[22px] border border-brand-border bg-brand-surface p-4">
                <p className="text-xs text-brand-muted">გამოყენებული კოინები</p>
                <p className="mt-1 text-sm text-brand-secondary tabular-nums">
                  ✦ {item.creditsUsed}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => onCopyLink(item)}
              disabled={!item.outputUrl}
            >
              <Copy className="size-4" />
              ბმულის კოპირება
            </Button>
            <Button
              className="rounded-full bg-brand-accent text-black hover:bg-brand-accent-hover"
              onClick={() => onDownload(item)}
              disabled={!item.outputUrl}
            >
              <Download className="size-4" />
              ჩამოტვირთვა
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
