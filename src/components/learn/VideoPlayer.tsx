"use client";

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    playerjs?: {
      Player: new (element: HTMLIFrameElement) => {
        on: (event: string, callback: (payload?: unknown) => void) => void;
        off?: (event: string, callback: (payload?: unknown) => void) => void;
        setCurrentTime?: (seconds: number) => void;
        play?: () => void;
        pause?: () => void;
      };
    };
  }
}

type VideoPlayerProps = {
  lessonId: string;
  lessonTitle: string;
  signedEmbedUrl: string;
  initialWatchedSeconds: number;
  initialCompleted: boolean;
  prevLessonHref?: string | null;
  nextLessonHref?: string | null;
  fallbackHref?: string | null;
};

type PlayerInstance = {
  on: (event: string, callback: (payload?: unknown) => void) => void;
  off?: (event: string, callback: (payload?: unknown) => void) => void;
  setCurrentTime?: (seconds: number) => void;
  play?: () => void;
  pause?: () => void;
};

function getSeconds(payload: unknown) {
  if (typeof payload === "number") {
    return payload;
  }

  if (payload && typeof payload === "object" && "seconds" in payload) {
    const seconds = (payload as { seconds?: unknown }).seconds;
    return typeof seconds === "number" ? seconds : 0;
  }

  return 0;
}

function getDuration(payload: unknown) {
  if (payload && typeof payload === "object" && "duration" in payload) {
    const duration = (payload as { duration?: unknown }).duration;
    return typeof duration === "number" ? duration : 0;
  }

  return 0;
}

export function VideoPlayer({
  lessonId,
  lessonTitle,
  signedEmbedUrl,
  initialWatchedSeconds,
  initialCompleted,
  prevLessonHref,
  nextLessonHref,
  fallbackHref,
}: VideoPlayerProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<PlayerInstance | null>(null);
  const lastSavedSecondsRef = useRef(initialWatchedSeconds);
  const currentSecondsRef = useRef(initialWatchedSeconds);
  const queuedSecondsRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const completionSavedRef = useRef(initialCompleted);
  const isActiveRef = useRef(true);

  const [scriptReady, setScriptReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(initialCompleted);
  const [paused, setPaused] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const playerId = useId().replace(/:/g, "");

  const iframeSrc = useMemo(() => {
    const separator = signedEmbedUrl.includes("?") ? "&" : "?";
    return `${signedEmbedUrl}${separator}player=${playerId}`;
  }, [playerId, signedEmbedUrl]);

  const persistProgress = useEffectEvent(async (
    watchedSeconds: number,
    markCompleted = false
  ) => {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        watchedSeconds: Math.max(0, Math.floor(watchedSeconds)),
        completed: markCompleted,
      }),
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.error ?? "პროგრესის შენახვა ვერ მოხერხდა");
    }
  });

  const moveToNextLesson = useEffectEvent(() => {
    const targetHref = nextLessonHref ?? fallbackHref ?? null;

    if (!targetHref || !isActiveRef.current) {
      return;
    }

    setTransitioning(true);
    router.push(targetHref);
  });

  const queueProgressSave = useEffectEvent((watchedSeconds: number) => {
    queuedSecondsRef.current = Math.max(
      queuedSecondsRef.current ?? 0,
      watchedSeconds
    );

    if (saveTimeoutRef.current !== null) {
      return;
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      const secondsToPersist = queuedSecondsRef.current;
      queuedSecondsRef.current = null;
      saveTimeoutRef.current = null;

      if (secondsToPersist === null) {
        return;
      }

      try {
        await persistProgress(secondsToPersist);
        if (isActiveRef.current) {
          setError(null);
        }
      } catch (progressError) {
        if (isActiveRef.current) {
          setError(
            progressError instanceof Error
              ? progressError.message
              : "პროგრესის შენახვა ვერ მოხერხდა"
          );
        }
      }
    }, 350);
  });

  useEffect(() => {
    isActiveRef.current = true;

    if (!scriptReady || !iframeRef.current || !window.playerjs?.Player) {
      return;
    }

    const iframeElement = iframeRef.current;
    const player = new window.playerjs.Player(iframeElement);
    playerRef.current = player;

    const handleReady = () => {
      if (!isActiveRef.current) {
        return;
      }

      setPlayerReady(true);
      setPaused(true);
      if (initialWatchedSeconds > 0) {
        player.setCurrentTime?.(initialWatchedSeconds);
      }
    };

    const handlePlay = () => {
      if (isActiveRef.current) {
        setPaused(false);
      }
    };

    const handlePause = () => {
      if (isActiveRef.current) {
        setPaused(true);
      }
    };

    const handleTimeUpdate = async (payload?: unknown) => {
      const currentSeconds = getSeconds(payload);
      const duration = getDuration(payload);
      currentSecondsRef.current = currentSeconds;

      if (currentSeconds - lastSavedSecondsRef.current >= 30) {
        lastSavedSecondsRef.current = currentSeconds;
        queueProgressSave(currentSeconds);
      }

      if (
        !completionSavedRef.current &&
        duration > 0 &&
        currentSeconds / duration >= 0.9
      ) {
        completionSavedRef.current = true;
        if (isActiveRef.current) {
          setCompleted(true);
        }
        try {
          await persistProgress(currentSeconds, true);
          if (isActiveRef.current) {
            setError(null);
          }
        } catch (progressError) {
          completionSavedRef.current = false;
          if (isActiveRef.current) {
            setCompleted(false);
            setError(
              progressError instanceof Error
                ? progressError.message
                : "გაკვეთილის დასრულება ვერ მოხერხდა"
            );
          }
        }
      }
    };

    const handleEnded = async () => {
      if (isActiveRef.current) {
        setCompleted(true);
      }

      try {
        if (!completionSavedRef.current) {
          completionSavedRef.current = true;
          await persistProgress(currentSecondsRef.current, true);
        }
        if (isActiveRef.current) {
          setError(null);
          moveToNextLesson();
        }
      } catch (progressError) {
        completionSavedRef.current = false;
        if (isActiveRef.current) {
          setCompleted(false);
          setError(
            progressError instanceof Error
              ? progressError.message
              : "გაკვეთილის დასრულება ვერ მოხერხდა"
          );
        }
      }
    };

    player.on("ready", handleReady);
    player.on("play", handlePlay);
    player.on("pause", handlePause);
    player.on("timeupdate", handleTimeUpdate);
    player.on("ended", handleEnded);

    return () => {
      isActiveRef.current = false;
      try {
        player.off?.("ready", handleReady);
        player.off?.("play", handlePlay);
        player.off?.("pause", handlePause);
        player.off?.("timeupdate", handleTimeUpdate);
        player.off?.("ended", handleEnded);
      } catch {
        // Bunny/PlayerJS teardown can throw during route changes.
      }
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      iframeElement.src = "about:blank";
      playerRef.current = null;
    };
  }, [initialWatchedSeconds, lessonId, router, scriptReady]);

  function navigateToHref(href: string | null | undefined) {
    if (!href || !isActiveRef.current) {
      return;
    }

    setTransitioning(true);
    router.push(href);
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("ვიდეო ფლეიერის ჩატვირთვა ვერ მოხერხდა")}
      />

      <div className="overflow-hidden rounded-[28px] border border-brand-border bg-brand-surface shadow-sm">
        <div className="border-b border-brand-border bg-brand-background/70 px-5 py-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-brand-muted">ვიდეო გაკვეთილი</p>
              <h2 className="mt-1 truncate text-base font-semibold text-brand-secondary">
                {lessonTitle}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <ShieldCheck className="size-3.5 text-brand-primary" />
                დაცული სტრიმი
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <PlayCircle className="size-3.5 text-brand-primary" />
                ავტომატური პროგრესი
              </Badge>
            </div>
          </div>
        </div>

        <div className="relative aspect-video bg-brand-surface-light">
          {!playerReady || transitioning ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-background/86">
              <div className="flex size-20 items-center justify-center rounded-full border border-brand-border bg-brand-surface shadow-sm">
                <LoaderCircle className="size-8 animate-spin text-brand-primary" />
              </div>
            </div>
          ) : null}

          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={lessonTitle}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            className={`size-full border-0 transition-opacity duration-200 ${playerReady && !transitioning ? "opacity-100" : "opacity-0"}`}
          />

          {playerReady && paused && !transitioning ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4">
              <div className="pointer-events-auto flex items-center gap-5 rounded-full border border-brand-border bg-brand-surface/90 px-4 py-3 shadow-sm backdrop-blur-md">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full border-brand-border bg-brand-surface-light text-brand-secondary shadow-sm hover:bg-brand-surface"
                  onClick={() => navigateToHref(prevLessonHref)}
                  disabled={!prevLessonHref}
                  aria-label="წინა გაკვეთილი"
                >
                  <ChevronLeft className="size-5" />
                </Button>

                <div className="flex items-center gap-2" aria-hidden="true">
                  <span className="block size-1.5 rounded-full bg-brand-primary/35" />
                  <span className="block h-10 w-px bg-brand-border" />
                  <span className="block size-1.5 rounded-full bg-brand-primary/35" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full border-brand-border bg-brand-surface-light text-brand-secondary shadow-sm hover:bg-brand-surface"
                  onClick={() => navigateToHref(nextLessonHref ?? fallbackHref)}
                  disabled={!nextLessonHref && !fallbackHref}
                  aria-label="შემდეგი გაკვეთილი"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-brand-border bg-brand-background/70 px-5 py-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-brand-muted">
              <span className={cn(
                "inline-block size-2.5 rounded-full",
                playerReady ? "bg-brand-success/100" : "bg-brand-primary"
              )} />
              {playerReady
                ? "ვიდეო მზად არის და პროგრესი ინახება ავტომატურად"
                : "ვიდეო მალე ჩაიტვირთება"}
            </div>

            {completed ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-success/10 px-3 py-1 font-medium text-brand-success">
                <CheckCircle2 className="size-4" />
                დასრულებულია
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-brand-danger/15 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
