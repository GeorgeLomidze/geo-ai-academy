"use client";

import { useRef, useState, useEffect, type ReactNode, type MouseEvent } from "react";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;

interface CanvasProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  children: ReactNode;
  svgOverlay?: ReactNode;
  onDoubleClick: (canvasX: number, canvasY: number, screenX: number, screenY: number) => void;
  onBackgroundClick: () => void;
}

export function Canvas({
  zoom,
  onZoomChange,
  children,
  svgOverlay,
  onDoubleClick,
  onBackgroundClick,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  // Wheel/trackpad handler via native event for { passive: false }
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();

      // Pinch-to-zoom on trackpad fires as wheel with ctrlKey=true
      if (e.ctrlKey || e.metaKey) {
        const rect = el!.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;

        const zoomFactor = 1 - e.deltaY * 0.01;
        const prev = zoomRef.current;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * zoomFactor));
        const clamped = Math.round(next * 100) / 100;

        // Zoom toward pointer
        const scale = clamped / prev;
        const newPanX = pointerX - scale * (pointerX - panRef.current.x);
        const newPanY = pointerY - scale * (pointerY - panRef.current.y);

        onZoomChange(clamped);
        setPan({ x: newPanX, y: newPanY });
        return;
      }

      // Two-finger swipe on trackpad / mouse wheel → pan
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [onZoomChange]);

  function isBackground(target: EventTarget | null) {
    if (!target || !(target instanceof HTMLElement)) return false;
    return (
      target === containerRef.current ||
      target.dataset.canvasBg !== undefined
    );
  }

  function handleMouseDown(e: MouseEvent) {
    if (!isBackground(e.target)) return;
    if (e.button !== 0) return;
    setPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function handleMouseMove(e: MouseEvent) {
    if (!panning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({
      x: panStart.current.panX + dx,
      y: panStart.current.panY + dy,
    });
  }

  function handleMouseUp() {
    setPanning(false);
  }

  function handleDoubleClick(e: MouseEvent) {
    if (!isBackground(e.target)) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    onDoubleClick(canvasX, canvasY, e.clientX, e.clientY);
  }

  function handleClick(e: MouseEvent) {
    if (isBackground(e.target)) {
      onBackgroundClick();
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative size-full overflow-hidden"
      style={{ cursor: panning ? "grabbing" : "default" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-brand-border) 1px, transparent 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        data-canvas-bg=""
      />

      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
        data-canvas-bg=""
      >
        {svgOverlay}
        {children}
      </div>
    </div>
  );
}
