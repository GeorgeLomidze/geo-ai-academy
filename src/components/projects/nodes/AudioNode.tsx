"use client";

import { Music } from "lucide-react";

export function AudioNode() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2">
      <Music className="size-8 text-white/15" />
      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] text-amber-400">
        მალე
      </span>
    </div>
  );
}
