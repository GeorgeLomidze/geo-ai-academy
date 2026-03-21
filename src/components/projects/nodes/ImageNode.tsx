"use client";

import { Image as ImageIcon, Loader2 } from "lucide-react";
import type { ProjectNodeData } from "../types";

interface ImageNodeProps {
  data: ProjectNodeData;
}

export function ImageNode({ data }: ImageNodeProps) {
  const isProcessing =
    data.status === "PROCESSING" || data.status === "PENDING";

  if (data.outputUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={data.outputUrl}
        alt={data.prompt ?? ""}
        className="size-full object-cover"
        draggable={false}
      />
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3">
      {isProcessing ? (
        <Loader2 className="size-8 animate-spin text-white/20" />
      ) : (
        <ImageIcon className="size-8 text-white/15" />
      )}
    </div>
  );
}
