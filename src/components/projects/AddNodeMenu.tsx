"use client";

import { Image, Video, Music, Upload } from "lucide-react";
import type { NodeType } from "./types";

interface AddNodeMenuProps {
  x: number;
  y: number;
  onAdd: (type: NodeType, x: number, y: number) => void;
  onClose: () => void;
}

const NODE_OPTIONS: {
  type: NodeType;
  label: string;
  icon: typeof Image;
  disabled?: boolean;
  badge?: string;
}[] = [
  { type: "IMAGE", label: "სურათი", icon: Image },
  { type: "VIDEO", label: "ვიდეო", icon: Video },
  { type: "AUDIO", label: "აუდიო", icon: Music, disabled: true, badge: "მალე" },
  { type: "UPLOAD", label: "ატვირთვა", icon: Upload },
];

export function AddNodeMenu({ x, y, onAdd, onClose }: AddNodeMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute z-50 w-48 overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-lg"
        style={{ left: x, top: y }}
      >
        <div className="px-3 py-2 text-xs font-medium text-brand-muted">
          ნოდის დამატება
        </div>
        {NODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.type}
              disabled={option.disabled}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-brand-secondary transition-colors hover:bg-brand-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
                onAdd(option.type, x, y);
                onClose();
              }}
            >
              <Icon className="size-4" />
              {option.label}
              {option.badge && (
                <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                  {option.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
