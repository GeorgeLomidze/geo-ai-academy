"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type State = "idle" | "visible" | "fading";

const SESSION_KEY = "geo-ai-loaded";

export function SiteLoader() {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    // Skip on every visit after the first within this browser tab session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    setState("visible");

    // Reduced-motion: show briefly then dismiss (CSS zeroes out animation durations)
    const fadeStart = reducedMotion ? 500 : 2200;
    const removeDelay = reducedMotion ? 50 : 420;

    const t1 = setTimeout(() => setState("fading"), fadeStart);
    const t2 = setTimeout(() => {
      setState("idle");
      sessionStorage.setItem(SESSION_KEY, "true");
    }, fadeStart + removeDelay);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-9999 flex flex-col items-center justify-center bg-brand-background",
        state === "fading" && "loader-animate-fadeout"
      )}
    >
      {/* Ambient amber glow — pulsing softly behind the logo */}
      <div
        aria-hidden="true"
        className="loader-animate-glow pointer-events-none absolute size-105 rounded-full"
      />

      {/* Logo — cinematic scale-fade reveal */}
      <div className="loader-animate-logo relative">
        <Image
          src="/logo.png"
          alt="GEO AI Academy"
          width={150}
          height={100}
          priority
          className="select-none object-contain drop-shadow-[0_0_24px_rgba(245,166,35,0.25)]"
        />
      </div>

      {/* Loading bar track */}
      <div className="loader-animate-bar-track relative mt-8 h-0.5 w-50 overflow-hidden rounded-full bg-white/[0.07]">
        {/* Amber fill — scaleX 0 → 1 from origin-left */}
        <div className="loader-animate-bar absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#F5A623]" />
      </div>
    </div>
  );
}
