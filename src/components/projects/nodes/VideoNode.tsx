"use client";

import { Video, Loader2 } from "lucide-react";
import type { ProjectNodeData } from "../types";

interface VideoNodeProps {
  data: ProjectNodeData;
}

export function VideoNode({ data }: VideoNodeProps) {
  const isProcessing =
    data.status === "PROCESSING" || data.status === "PENDING";

  if (data.outputUrl) {
    return (
      <video
        data-node-interactive=""
        src={data.outputUrl}
        controls
        className="size-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3">
      {isProcessing ? (
        <Loader2 className="size-8 animate-spin text-white/20" />
      ) : (
        <Video className="size-8 text-white/15" />
      )}
    </div>
  );
}
