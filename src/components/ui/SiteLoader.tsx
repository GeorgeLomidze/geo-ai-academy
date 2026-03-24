"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const SESSION_KEY = "geo-ai-loaded";

const EMOJIS = [
  { icon: "📷", label: "ფოტო" },
  { icon: "🎥", label: "ვიდეო" },
  { icon: "🎤", label: "ხმა" },
] as const;

const EMOJI_CYCLE_MS = 1150; // total time each emoji is on screen
const EMOJI_EXIT_MS  = 300;  // exit animation duration

type State     = "visible" | "bar-complete" | "fading" | "idle";
type EmojiPhase = "entering" | "exiting";

export function SiteLoader() {
  // ── Start as "visible" so the server renders the loader and it appears
  //    on the very first paint — no flash of site content before loader.
  const [state,      setState]      = useState<State>("visible");
  const [emojiIdx,   setEmojiIdx]   = useState(0);
  const [emojiPhase, setEmojiPhase] = useState<EmojiPhase>("entering");

  useEffect(() => {
    // Returning visitor within the same tab session — instantly hide
    if (sessionStorage.getItem(SESSION_KEY)) {
      setState("idle");
      return;
    }

    let cancelled = false;

    // Show loader for the LONGER of: 3 seconds OR full page load
    const minDelay = new Promise<void>(r => setTimeout(r, 3000));
    const pageLoad = new Promise<void>(r => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", () => r(), { once: true });
    });

    Promise.all([minDelay, pageLoad]).then(() => {
      if (cancelled) return;
      // 1. Bar snaps to 100%
      setState("bar-complete");
      // 2. After bar finishes, start overlay fade-out
      setTimeout(() => {
        if (cancelled) return;
        setState("fading");
        // 3. Remove from DOM after fade completes
        setTimeout(() => {
          if (cancelled) return;
          setState("idle");
          sessionStorage.setItem(SESSION_KEY, "true");
        }, 540);
      }, 360);
    });

    // Emoji cycling
    const emojiTimer = setInterval(() => {
      if (cancelled) return;
      setEmojiPhase("exiting");
      setTimeout(() => {
        if (cancelled) return;
        setEmojiIdx(i => (i + 1) % EMOJIS.length);
        setEmojiPhase("entering");
      }, EMOJI_EXIT_MS);
    }, EMOJI_CYCLE_MS);

    return () => {
      cancelled = true;
      clearInterval(emojiTimer);
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div
      id="site-loader"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-brand-background",
        state === "fading" && "loader-fade-out"
      )}
    >
      {/* Subtle amber grid — depth layer */}
      <div aria-hidden="true" className="loader-grid pointer-events-none absolute inset-0" />

      {/* Large ambient glow centered behind logo */}
      <div aria-hidden="true" className="loader-glow pointer-events-none absolute size-130 rounded-full" />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Logo */}
        <div className="loader-logo-animate">
          <Image
            src="/logo.png"
            alt="GEO AI Academy"
            width={210}
            height={140}
            priority
            className="loader-logo-glow select-none object-contain"
          />
        </div>

        {/* Tagline */}
        <p className="loader-tagline-animate mt-3 text-center font-nav text-xs tracking-wider text-brand-muted">
          ხელოვნური ინტელექტის სასწავლო პლატფორმა
        </p>

        {/* ── Emoji showcase ── */}
        <div className="mt-10 flex flex-col items-center gap-3">

          {/* Circular ring container */}
          <div className="loader-emoji-ring relative flex size-24 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/6 backdrop-blur-sm">
            <span
              key={emojiIdx}
              className={cn(
                "select-none text-4xl leading-none",
                emojiPhase === "entering" ? "loader-emoji-enter" : "loader-emoji-exit"
              )}
            >
              {EMOJIS[emojiIdx]!.icon}
            </span>
          </div>

          {/* Indicator dots */}
          <div className="flex items-center gap-2">
            {EMOJIS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === emojiIdx
                    ? "size-2 bg-brand-accent"
                    : "size-1.5 bg-white/20"
                )}
              />
            ))}
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="mt-10 h-0.5 w-60 overflow-hidden rounded-full bg-white/6">
          <div
            className={cn(
              "h-full w-full origin-left rounded-full",
              state === "bar-complete"
                ? "loader-bar-completing"
                : "loader-bar-filling"
            )}
          />
        </div>

      </div>
    </div>
  );
}
