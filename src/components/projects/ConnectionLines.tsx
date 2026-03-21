"use client";

import type { ProjectNode } from "./types";

interface DragLine {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface ConnectionLinesProps {
  nodes: ProjectNode[];
  selectedNodeId: string | null;
  dragLine?: DragLine | null;
}

export function ConnectionLines({ nodes, selectedNodeId, dragLine }: ConnectionLinesProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const lines: {
    key: string;
    sx: number;
    sy: number;
    tx: number;
    ty: number;
    highlight: boolean;
  }[] = [];

  for (const node of nodes) {
    const conns = node.data.connections;
    if (!conns?.length) continue;

    // Target anchor: left edge center
    const tx = node.x;
    const ty = node.y + node.height / 2 + 20; // +20 for label row above preview

    for (const conn of conns) {
      const source = nodeMap.get(conn.sourceNodeId);
      if (!source) continue;

      // Source anchor: right edge center
      const sx = source.x + source.width;
      const sy = source.y + source.height / 2 + 20;

      const highlight =
        selectedNodeId === node.id || selectedNodeId === source.id;

      lines.push({
        key: `${conn.sourceNodeId}-${node.id}-${conn.role}`,
        sx,
        sy,
        tx,
        ty,
        highlight,
      });
    }
  }

  const hasContent = lines.length > 0 || dragLine;
  if (!hasContent) return null;

  function renderBezier(
    key: string,
    sx: number,
    sy: number,
    tx: number,
    ty: number,
    strokeColor: string,
    opacity: number
  ) {
    const dx = Math.abs(tx - sx);
    const cpOffset = Math.max(50, dx * 0.4);

    const d = `M ${sx} ${sy} C ${sx + cpOffset} ${sy}, ${tx - cpOffset} ${ty}, ${tx} ${ty}`;

    // Midpoint at t=0.5
    const mx =
      0.125 * sx +
      0.375 * (sx + cpOffset) +
      0.375 * (tx - cpOffset) +
      0.125 * tx;
    const my =
      0.125 * sy + 0.375 * sy + 0.375 * ty + 0.125 * ty;

    return (
      <g key={key}>
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeOpacity={opacity}
        />
        <circle
          cx={mx}
          cy={my}
          r={3}
          fill={strokeColor}
          opacity={opacity}
        />
      </g>
    );
  }

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      style={{ overflow: "visible" }}
      width="1"
      height="1"
    >
      {lines.map((l) =>
        renderBezier(
          l.key,
          l.sx,
          l.sy,
          l.tx,
          l.ty,
          l.highlight ? "var(--color-brand-accent)" : "#4A4A4A",
          l.highlight ? 0.8 : 0.5
        )
      )}
      {dragLine &&
        renderBezier(
          "drag-line",
          dragLine.fromX,
          dragLine.fromY,
          dragLine.toX,
          dragLine.toY,
          "var(--color-brand-accent)",
          0.6
        )}
    </svg>
  );
}
