"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  Image,
  Video,
  Music,
  Upload,
  Loader2,
  Trash2,
  Plus,
  Download,
  X,
} from "lucide-react";
import type { NodeType } from "./types";

const NODE_ICONS: Record<NodeType, typeof Image> = {
  IMAGE: Image,
  VIDEO: Video,
  AUDIO: Music,
  UPLOAD: Upload,
};

const NODE_LABELS: Record<NodeType, string> = {
  IMAGE: "Image",
  VIDEO: "Video",
  AUDIO: "Audio",
  UPLOAD: "Upload",
};

// Gap between node edge and plus button center
const PLUS_GAP = 24;
// Button diameter
const PLUS_SIZE = 28;
// Total horizontal extent beyond node edge that needs to be hoverable
const HOVER_PAD = PLUS_GAP + PLUS_SIZE / 2 + 4; // 42px
// Max magnetic pull distance (px the button shifts toward cursor)
const MAGNET_RANGE = 60;
const MAGNET_STRENGTH = 14;

interface NodeCardProps {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  processing?: boolean;
  hasOutput?: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPlusMouseDown?: (side: "left" | "right", e: MouseEvent) => void;
  downloadUrl?: string | null;
  downloadFilename?: string;
  children: ReactNode;
  promptBar?: ReactNode;
}

export function NodeCard({
  id,
  type,
  x,
  y,
  width,
  height,
  selected,
  processing,
  onMove,
  onSelect,
  onDelete,
  onPlusMouseDown,
  downloadUrl,
  downloadFilename,
  children,
  promptBar,
}: NodeCardProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  // Magnetic offsets for left/right plus buttons
  const [leftMagnet, setLeftMagnet] = useState({ dx: 0, dy: 0 });
  const [rightMagnet, setRightMagnet] = useState({ dx: 0, dy: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const Icon = NODE_ICONS[type];

  // Delete key handler
  useEffect(() => {
    if (!selected) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        onDelete(id);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selected, id, onDelete]);

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "TEXTAREA" ||
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.closest("[data-prompt-bar]") ||
      target.closest("[data-node-action]") ||
      target.closest("[data-node-interactive]")
    ) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      nodeX: x,
      nodeY: y,
      moved: false,
    };

    function onMouseMove(ev: globalThis.MouseEvent) {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragRef.current.moved = true;
      }
      onMove(id, dragRef.current.nodeX + dx, dragRef.current.nodeY + dy);
    }

    function onMouseUp() {
      const wasDrag = dragRef.current?.moved;
      dragRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (!wasDrag) {
        onSelect(id);
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  // The label row is ~24px, preview center Y in card coords
  const previewCenterY = 24 + height / 2;
  // Button resting positions relative to the wrapper (which has HOVER_PAD padding)
  const leftBtnX = HOVER_PAD - PLUS_GAP;
  const rightBtnX = HOVER_PAD + width + PLUS_GAP;
  const btnY = previewCenterY;

  function handleCardMouseMove(e: MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const transformEl = cardRef.current.closest("[data-canvas-bg]") as HTMLElement | null;
    let zoomVal = 1;
    if (transformEl) {
      const matrix = new DOMMatrix(getComputedStyle(transformEl).transform);
      zoomVal = matrix.a || 1;
    }
    const cx = (e.clientX - rect.left) / zoomVal;
    const cy = (e.clientY - rect.top) / zoomVal;

    // Magnetic pull for left button
    const ldx = cx - leftBtnX;
    const ldy = cy - btnY;
    const lDist = Math.sqrt(ldx * ldx + ldy * ldy);
    if (lDist < MAGNET_RANGE && lDist > 0) {
      const strength = (1 - lDist / MAGNET_RANGE) * MAGNET_STRENGTH;
      setLeftMagnet({ dx: (ldx / lDist) * strength, dy: (ldy / lDist) * strength });
    } else {
      setLeftMagnet({ dx: 0, dy: 0 });
    }

    // Magnetic pull for right button
    const rdx = cx - rightBtnX;
    const rdy = cy - btnY;
    const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
    if (rDist < MAGNET_RANGE && rDist > 0) {
      const strength = (1 - rDist / MAGNET_RANGE) * MAGNET_STRENGTH;
      setRightMagnet({ dx: (rdx / rDist) * strength, dy: (rdy / rDist) * strength });
    } else {
      setRightMagnet({ dx: 0, dy: 0 });
    }
  }

  function handlePlusMouseDown(side: "left" | "right", e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onPlusMouseDown?.(side, e);
  }

  async function handleDownload(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();

    if (!downloadUrl) {
      return;
    }

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = downloadFilename ?? `${type.toLowerCase()}-${id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  }

  const showPlus = hovered || selected;

  return (
    <div
      ref={cardRef}
      className="absolute select-none"
      style={{
        left: x - HOVER_PAD,
        top: y,
        width: width + HOVER_PAD * 2,
        paddingLeft: HOVER_PAD,
        paddingRight: HOVER_PAD,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleCardMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setLeftMagnet({ dx: 0, dy: 0 });
        setRightMagnet({ dx: 0, dy: 0 });
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(id);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Type label */}
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <Icon className="size-3.5 text-brand-accent/40" />
        <span className="text-xs text-brand-accent/50">{NODE_LABELS[type]}</span>
        {processing && (
          <Loader2 className="ml-1 size-3 animate-spin text-brand-accent" />
        )}
      </div>

      {/* Preview area */}
      <div
        className={`relative cursor-grab overflow-hidden rounded-2xl border transition-all active:cursor-grabbing ${
          selected
            ? "border-brand-accent/30 shadow-[0_0_20px_rgba(var(--brand-accent-rgb,234,179,8),0.08)]"
            : "border-white/[0.08] hover:border-white/15"
        }`}
        style={{ height, background: "#161616" }}
      >
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
          {downloadUrl ? (
            <button
              type="button"
              data-node-action=""
              aria-label="გადმოწერა"
              className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/75 transition-colors hover:border-brand-accent/30 hover:text-white"
              onClick={handleDownload}
            >
              <Download className="size-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            data-node-action=""
            aria-label="ნოდის წაშლა"
            className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/75 transition-colors hover:border-red-400/40 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(id);
            }}
          >
            <X className="size-3.5" />
          </button>
        </div>

        {children}
      </div>

      {/* Plus buttons — centered on preview, magnetic micro-interaction */}
      {showPlus && (
        <>
          {/* Left plus */}
          <button
            className="absolute z-10 flex cursor-crosshair items-center justify-center rounded-full border border-[#4A4A4A] bg-[#1E1E1E] text-white/70 transition-colors duration-150 hover:border-brand-accent/60 hover:text-white"
            style={{
              width: PLUS_SIZE,
              height: PLUS_SIZE,
              left: leftBtnX - PLUS_SIZE / 2 + leftMagnet.dx,
              top: btnY - PLUS_SIZE / 2 + leftMagnet.dy,
              transition: "border-color 150ms, color 150ms",
            }}
            onMouseDown={(e) => handlePlusMouseDown("left", e)}
          >
            <Plus className="size-3.5" />
          </button>

          {/* Right plus */}
          <button
            className="absolute z-10 flex cursor-crosshair items-center justify-center rounded-full border border-[#4A4A4A] bg-[#1E1E1E] text-white/70 transition-colors duration-150 hover:border-brand-accent/60 hover:text-white"
            style={{
              width: PLUS_SIZE,
              height: PLUS_SIZE,
              left: rightBtnX - PLUS_SIZE / 2 + rightMagnet.dx,
              top: btnY - PLUS_SIZE / 2 + rightMagnet.dy,
              transition: "border-color 150ms, color 150ms",
            }}
            onMouseDown={(e) => handlePlusMouseDown("right", e)}
          >
            <Plus className="size-3.5" />
          </button>
        </>
      )}

      {/* Prompt bar — rendered directly below the node, wider than frame */}
      {selected && promptBar && (
        <div
          className="relative mt-3"
          data-prompt-bar=""
          style={{ width: width + 60, left: -30 }}
        >
          {promptBar}
        </div>
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="fixed z-[9999] w-40 select-none overflow-hidden rounded-xl border border-brand-accent/10 bg-[#1a1a1a] shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              onClick={() => {
                setContextMenu(null);
                onDelete(id);
              }}
            >
              <Trash2 className="size-4" />
              წაშლა
            </button>
          </div>
        </>
      )}
    </div>
  );
}
