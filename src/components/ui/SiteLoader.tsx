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

    // Reduced-motion: skip long animation, show briefly then dismiss quickly
    const fadeStart = reducedMotion ? 500 : 2200;
    // Fade-out is forced to ~0ms by the global CSS reduced-motion rule,
    // so we only need a short cleanup delay in that case.
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
        // Full-screen overlay on top of everything
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-background",
        // Fade-out state: animate out and stop blocking clicks
        state === "fading" && "[animation:var(--anim-loader-fadeout)] pointer-events-none"
      )}
    >
      {/* Ambient amber glow — pulsing softly behind the logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute size-[420px] rounded-full [animation:var(--anim-loader-glow)] [background:radial-gradient(circle,rgba(245,166,35,0.15)_0%,transparent_65%)]"
      />

      {/* Logo — cinematic scale-fade reveal */}
      <div className="relative [animation:var(--anim-loader-logo)]">
        <Image
          src="/logo.png"
          alt="GEO AI Academy"
          width={150}
          height={100}
          priority
          className="select-none object-contain drop-shadow-[0_0_24px_rgba(245,166,35,0.25)]"
        />
      </div>

      {/* Loading bar */}
      <div
        className="relative mt-8 h-[2px] w-[200px] overflow-hidden rounded-full bg-white/[0.07] [animation:var(--anim-loader-bar-track)]"
      >
        {/* Amber fill — animates scaleX 0 → 1 from the left */}
        <div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#F5A623] [animation:var(--anim-loader-bar)] [box-shadow:0_0_10px_rgba(245,166,35,0.65)]"
        />
      </div>
    </div>
  );
}
