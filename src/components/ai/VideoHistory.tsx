"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  Clapperboard,
  Download,
  Film,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIHistoryItem } from "@/components/ai/types"

function formatDate(value: string) {
  const d = new Date(value)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

function FormattedDate({ value }: { value: string }) {
  const [text, setText] = useState("")

  useEffect(() => {
    setText(formatDate(value))
  }, [value])

  return (
    <span className="text-xs text-brand-muted" suppressHydrationWarning>
      {text}
    </span>
  )
}

interface VideoHistoryProps {
  items: AIHistoryItem[]
  onRerun: (item: AIHistoryItem) => void
  onDelete: (id: string) => void
}

function getPromptPreview(prompt?: string | null) {
  if (!prompt) {
    return "პრომპტი არ არის შენახული"
  }

  const normalized = prompt.replace(/\s+/g, " ").trim()
  const sentences = normalized.match(/[^.!?]+[.!?]?/g) ?? [normalized]
  const preview = sentences.slice(0, 2).join(" ").trim()
  return preview || normalized
}

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(() => {
    const diff = Date.now() - new Date(createdAt).getTime()
    return Math.max(0, Math.floor(diff / 1000))
  })

  useEffect(() => {
    const id = window.setInterval(() => {
      const diff = Date.now() - new Date(createdAt).getTime()
      setElapsed(Math.max(0, Math.floor(diff / 1000)))
    }, 1000)
    return () => window.clearInterval(id)
  }, [createdAt])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return (
    <span className="tabular-nums">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  )
}

function DeleteConfirmation({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/10 px-3 py-2">
      <p className="flex-1 text-xs text-brand-secondary">ნამდვილად გსურთ წაშლა?</p>
      <button
        type="button"
        className="rounded-md bg-brand-danger px-3 py-1 text-xs text-white hover:bg-brand-danger/80"
        onClick={onConfirm}
      >
        წაშლა
      </button>
      <button
        type="button"
        className="rounded-md border border-brand-border px-3 py-1 text-xs text-brand-muted hover:text-brand-secondary"
        onClick={onCancel}
      >
        გაუქმება
      </button>
    </div>
  )
}

function HistoryCard({
  item,
  onRerun,
  onDelete,
}: {
  item: AIHistoryItem
  onRerun: (item: AIHistoryItem) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const isReady = item.status === "SUCCEEDED" && item.outputUrl
  const isPending = item.status === "PENDING" || item.status === "PROCESSING"
  const isFailed = item.status === "FAILED" || item.status === "CANCELED"

  async function handleCopyPrompt() {
    if (!item.prompt) {
      return
    }

    try {
      await navigator.clipboard.writeText(item.prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/ai/${item.id}`, { method: "DELETE" })
      if (res.ok) {
        onDelete(item.id)
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-brand-border bg-[#101010]">
      <div className="relative aspect-video overflow-hidden border-b border-brand-border bg-[#090909]">
        {isReady ? (
          <>
            <video
              src={item.outputUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              className="size-full bg-black object-contain"
            />
          </>
        ) : isPending ? (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-6">
            <div className="relative">
              <Film className="size-10 animate-pulse text-brand-accent/60" />
              <span className="absolute -bottom-1 -right-1 size-3 animate-ping rounded-full bg-brand-accent/40" />
            </div>
            <p className="text-sm text-brand-secondary">ვიდეო მზადდება...</p>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <ElapsedTimer createdAt={item.createdAt} />
            </div>
          </div>
        ) : isFailed ? (
          <div className="flex size-full flex-col items-center justify-center px-6 text-center">
            <p className="text-base text-brand-secondary">ვიდეო ვერ დასრულდა</p>
            <p className="mt-2 text-sm text-brand-muted">
              {item.prompt ?? "პრომპტი არ არის შენახული"}
            </p>
          </div>
        ) : (
          <div className="flex size-full items-center justify-center bg-[#0d0d0d] text-brand-muted">
            <Clapperboard className="size-5" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-md border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] text-white">
            {item.modelName}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-3 text-sm text-brand-secondary text-pretty">
              {getPromptPreview(item.prompt)}
            </p>
          </div>
          <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-2.5 py-1 text-xs text-brand-accent tabular-nums">
            ✦ {item.creditsUsed}
          </span>
        </div>

        {confirmDelete ? (
          <div className="mt-3">
            <DeleteConfirmation
              onConfirm={() => void handleDelete()}
              onCancel={() => setConfirmDelete(false)}
            />
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            <FormattedDate value={item.createdAt} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="პრომპტის კოპირება"
                className="inline-flex h-8 items-center justify-center rounded-md border border-brand-border px-3 text-xs text-brand-secondary transition-colors hover:border-brand-accent/30 hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleCopyPrompt()}
                disabled={!item.prompt}
              >
                <Copy className="mr-1.5 size-3.5" />
                {copied ? "დაკოპირდა" : "კოპირება"}
              </button>
              {isReady && item.outputUrl ? (
                <a
                  href={item.outputUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center rounded-md border border-brand-border px-3 text-xs text-brand-secondary transition-colors hover:border-brand-accent/30 hover:text-brand-accent"
                >
                  <Download className="mr-1.5 size-3.5" />
                  ჩამოტვირთვა
                </a>
              ) : null}
              <button
                type="button"
                aria-label="წაშლა"
                className="inline-flex size-8 items-center justify-center rounded-md border border-brand-border text-brand-muted transition-colors hover:border-brand-danger/30 hover:text-brand-danger disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
              >
                <Trash2 className="size-3.5" />
              </button>
              <Button
                variant="outline"
                className="rounded-md"
                onClick={() => onRerun(item)}
                disabled={!item.prompt}
              >
                <RotateCcw className="size-4" />
                რეგენერაცია
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export function VideoHistory({
  items,
  onRerun,
  onDelete,
}: VideoHistoryProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 brand-scrollbar">
        {items.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-brand-border px-6 text-center">
            <Sparkles className="size-9 text-brand-accent" />
            <p className="mt-4 text-lg text-brand-secondary text-balance">
              ვიდეო ისტორია ჯერ ცარიელია
            </p>
            <p className="mt-2 text-sm text-brand-muted text-pretty">
              შექმენი პირველი ვიდეო და ის აქ გამოჩნდება.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onRerun={onRerun}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
