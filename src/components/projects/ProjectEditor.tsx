"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Monitor,
  Image as ImageIcon,
  Video,
  Music,
  Upload,
  Loader2,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";
import { CreditDisplay } from "@/components/ai/CreditDisplay";
import { Switch } from "@/components/ui/switch";
import { Canvas } from "./Canvas";
import { NodeCard } from "./NodeCard";
import { ConnectionLines } from "./ConnectionLines";
import { ImageNode } from "./nodes/ImageNode";
import { VideoNode } from "./nodes/VideoNode";
import { AudioNode } from "./nodes/AudioNode";
import { UploadNode } from "./nodes/UploadNode";
import {
  getImageModelCoins,
  getModelMetadata,
  VIDEO_MODELS as VIDEO_MODELS_MAP,
  getVideoModelCoins,
} from "@/lib/credits/pricing";
import type { ProjectNode, ProjectNodeData, NodeType, NodeConnection } from "./types";

const IMAGE_MODEL_ORDER = [
  "nanobananapro",
  "nanobanana2",
  "nanobanana",
  "seedream5lite",
  "grok_t2i",
  "openaiimage",
  "flux",
] as const;

// ── Image models (sourced from centralized pricing metadata) ─────────
const IMAGE_MODEL_LIST = IMAGE_MODEL_ORDER.map((id) => {
  const meta = getModelMetadata(id);
  return {
    id,
    name: meta?.name ?? id,
    coins: meta?.coins ?? 0,
  };
});

// ── Video models (match visible models from VideoGenerator) ──
const VISIBLE_VIDEO_MODEL_IDS = Object.entries(VIDEO_MODELS_MAP)
  .filter(([, cfg]) => !cfg.hidden)
  .map(([id]) => id);

const ALL_VIDEO_MODEL_IDS = Object.keys(VIDEO_MODELS_MAP);

const VIDEO_MODEL_ORDER = (() => {
  const ids = [...VISIBLE_VIDEO_MODEL_IDS];
  const motionIndex = ids.indexOf("kling3_motion");
  const klingIndex = ids.indexOf("kling3");

  if (motionIndex !== -1 && klingIndex !== -1) {
    ids.splice(motionIndex, 1);
    ids.splice(klingIndex + 1, 0, "kling3_motion");
  }

  return ids;
})();

const VIDEO_MODEL_LIST = ALL_VIDEO_MODEL_IDS.map((id) => {
  const cfg = VIDEO_MODELS_MAP[id];
  return {
    id,
    name: cfg.name,
    coins: cfg.coinsByResolution[cfg.defaultResolution] ?? Object.values(cfg.coinsByResolution)[0] ?? 0,
    inputMode: cfg.inputMode,
    category: cfg.category,
    supportsAudio: cfg.supportsAudio,
    supportsMultiShot: cfg.supportsMultiShot,
    resolutions: cfg.resolutions,
    aspectRatios: cfg.aspectRatios,
    durations: cfg.durations,
    defaultResolution: cfg.defaultResolution,
    defaultAspectRatio: cfg.defaultAspectRatio,
    defaultDuration: cfg.defaultDuration,
    coinsPerSecondByResolution: cfg.coinsPerSecondByResolution,
    supportsFirstLastFrames: cfg.supportsFirstLastFrames,
    hidden: cfg.hidden,
    variants: cfg.variants,
  };
});

const VISIBLE_VIDEO_MODEL_LIST = VIDEO_MODEL_ORDER
  .map((id) => VIDEO_MODEL_LIST.find((item) => item.id === id))
  .filter((item): item is (typeof VIDEO_MODEL_LIST)[number] => Boolean(item));

function getPreferredVideoModelId(modelId: string) {
  if (modelId === "veo31") {
    return "veo31fast";
  }

  return modelId;
}

type UploadedProjectMedia = {
  fileName: string;
  fileUrl: string;
  fileType: string;
  imageWidth?: number;
  imageHeight?: number;
};

async function getImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () =>
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      img.onerror = () => reject(new Error("სურათის დამუშავება ვერ მოხერხდა"));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function normalizeProjectUpload(file: File): Promise<{
  file: File;
  imageWidth?: number;
  imageHeight?: number;
}> {
  if (!file.type.startsWith("image/")) {
    return { file };
  }

  const dimensions = await getImageDimensions(file);
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("სურათის დამუშავება ვერ მოხერხდა"));
      element.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("სურათის დამუშავება ვერ მოხერხდა");
    }

    context.drawImage(img, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("სურათის დამუშავება ვერ მოხერხდა"));
      }, "image/png");
    });

    const nextName = file.name.replace(/\.[^.]+$/, "") || "upload";

    return {
      file: new File([blob], `${nextName}.png`, { type: "image/png" }),
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadProjectMedia(file: File): Promise<UploadedProjectMedia> {
  const normalized = await normalizeProjectUpload(file);
  const formData = new FormData();
  formData.append("file", normalized.file);

  const response = await fetch("/api/projects/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.errors?.file ?? body?.error ?? "ატვირთვა ვერ მოხერხდა";
    throw new Error(message);
  }

  const { url } = (await response.json()) as { url?: string };

  if (!url) {
    throw new Error("ატვირთვა ვერ მოხერხდა");
  }

  return {
    fileName: normalized.file.name,
    fileUrl: url,
    fileType: normalized.file.type,
    imageWidth: normalized.imageWidth,
    imageHeight: normalized.imageHeight,
  };
}

// ── Per-model quality options (from ImageGenerator) ──
const QUALITY_OPTIONS: Record<string, string[]> = {
  nanobanana2: ["1K", "2K", "4K"],
  nanobananapro: ["1K", "2K", "4K"],
  seedream5lite: ["2K", "4K"],
};

// ── Per-model aspect ratio options (from ImageGenerator) ──
const IMAGE_ASPECT_RATIO_OPTIONS: Record<string, readonly string[]> = {
  nanobanana: ["1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  nanobanana2: ["1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  nanobananapro: ["1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  seedream5lite: ["1:1", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
  grok_t2i: ["1:1", "3:2", "2:3", "16:9", "9:16"],
  openaiimage: ["1:1", "3:2", "2:3"],
  flux: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"],
};

const DEFAULT_IMAGE_ASPECT_RATIOS: readonly string[] = ["1:1", "4:5", "5:4", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"];

const DEFAULT_NODE_SIZES: Record<NodeType, { width: number; height: number }> =
  {
    IMAGE: { width: 420, height: 260 },
    VIDEO: { width: 420, height: 260 },
    AUDIO: { width: 280, height: 180 },
    UPLOAD: { width: 320, height: 220 },
  };

const DEFAULT_NODE_ASPECT_RATIOS: Partial<Record<NodeType, string>> = {
  IMAGE: "1:1",
  VIDEO: "16:9",
};

const ADD_NODE_ITEMS: {
  type: NodeType;
  label: string;
  icon: typeof ImageIcon;
  disabled?: boolean;
}[] = [
  { type: "IMAGE", label: "სურათი", icon: ImageIcon },
  { type: "VIDEO", label: "ვიდეო", icon: Video },
  { type: "AUDIO", label: "აუდიო", icon: Music, disabled: true },
  { type: "UPLOAD", label: "ატვირთვა", icon: Upload },
];

// ── Component ───────────────────────────────────────────
interface ProjectEditorProps {
  projectId: string;
  initialTitle: string;
  initialNodes: ProjectNode[];
  initialBalance: number;
}

function ProjectMediaInputCard({
  title,
  description,
  emptyLabel,
  accept,
  isVideo,
  mediaUrl,
  onUpload,
  onRemove,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  accept: string;
  isVideo: boolean;
  mediaUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ატვირთვა ვერ მოხერხდა");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
      <div className="mb-2 flex items-center gap-2">
        {mediaUrl ? (
          isVideo ? (
            <video
              src={mediaUrl}
              className="size-11 rounded-lg border border-white/10 object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <>
              {/* Remote user uploads are rendered directly in the canvas node preview. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt={title}
                className="size-11 rounded-lg border border-white/10 object-cover"
              />
            </>
          )
        ) : (
          <div className="flex size-11 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] text-[10px] text-white/30">
            +
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/75">{title}</p>
          <p className="text-[11px] text-white/35">{description}</p>
        </div>

        {mediaUrl ? (
          <button
            className="inline-flex size-5 items-center justify-center rounded-full bg-red-500/80 text-[10px] text-white"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={uploading}
        >
          {uploading ? "იტვირთება..." : "ატვირთვა"}
        </button>
        <span className="text-[11px] text-white/28">{emptyLabel}</span>
      </div>

      {error ? <p className="mt-2 text-[11px] text-brand-danger">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />
    </div>
  );
}

export function ProjectEditor({
  projectId,
  initialTitle,
  initialNodes,
  initialBalance,
}: ProjectEditorProps) {
  const [nodes, setNodes] = useState<ProjectNode[]>(() =>
    initialNodes.map((node) => {
      if (!node.data.aspectRatio) {
        return node;
      }

      const nextSize = getNodeSizeForAspectRatio(node.type, node.data.aspectRatio);
      return {
        ...node,
        width: nextSize.width,
        height: nextSize.height,
      };
    })
  );
  const [title, setTitle] = useState(initialTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dblClickMenu, setDblClickMenu] = useState<{
    screenX: number;
    screenY: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);
  const [connectionMenu, setConnectionMenu] = useState<{
    sourceNodeId: string;
    side: "left" | "right";
    screenX: number;
    screenY: number;
  } | null>(null);
  const [dragConn, setDragConn] = useState<{
    sourceNodeId: string;
    side: "left" | "right";
    cursorX: number;
    cursorY: number;
  } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Per-node prompt state (synced when selection changes)
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNodesRef = useRef(nodes);
  const latestTitleRef = useRef(title);
  latestNodesRef.current = nodes;
  latestTitleRef.current = title;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  // Sync prompt when selection changes
  useEffect(() => {
    if (selectedNode) {
      setPrompt(selectedNode.data.prompt ?? "");
      setError(null);
      closeDropdown();
    }
  }, [selectedNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 1024);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Auto-save ──
  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: latestTitleRef.current,
          nodes: latestNodesRef.current,
        }),
      });
    }, 2000);
  }

  function updateNodes(updater: (prev: ProjectNode[]) => ProjectNode[]) {
    setNodes((prev) => {
      const next = updater(prev);
      latestNodesRef.current = next;
      scheduleSave();
      return next;
    });
  }

  function handleTitleBlur() {
    setEditingTitle(false);
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(initialTitle);
      return;
    }
    scheduleSave();
  }

  function parseAspectRatio(ar: string): { w: number; h: number } | null {
    const parts = ar.split(":").map(Number);
    const w = parts[0];
    const h = parts[1];
    if (w && h && w > 0 && h > 0) return { w, h };
    return null;
  }

  function getNodeSizeForAspectRatio(
    type: NodeType,
    aspectRatio?: string
  ): { width: number; height: number } {
    const fallback = DEFAULT_NODE_SIZES[type];

    if (!aspectRatio || (type !== "IMAGE" && type !== "VIDEO")) {
      return fallback;
    }

    const parsed = parseAspectRatio(aspectRatio);
    if (!parsed) {
      return fallback;
    }

    const maxEdge = Math.max(fallback.width, fallback.height);

    if (parsed.w >= parsed.h) {
      return {
        width: maxEdge,
        height: Math.round(maxEdge * (parsed.h / parsed.w)),
      };
    }

    return {
      width: Math.round(maxEdge * (parsed.w / parsed.h)),
      height: maxEdge,
    };
  }

  // ── Node CRUD ──
  function addNode(type: NodeType) {
    const aspectRatio = DEFAULT_NODE_ASPECT_RATIOS[type];
    const size = getNodeSizeForAspectRatio(type, aspectRatio);
    const centerX = 300 + nodes.length * 60;
    const centerY = 150 + nodes.length * 40;
    const node: ProjectNode = {
      id: crypto.randomUUID(),
      type,
      x: centerX,
      y: centerY,
      width: size.width,
      height: size.height,
      data: aspectRatio ? { aspectRatio } : {},
    };
    updateNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
    setShowAddMenu(false);
    setDblClickMenu(null);
  }

  function handleAddNodeAtPosition(type: NodeType, cx: number, cy: number) {
    const aspectRatio = DEFAULT_NODE_ASPECT_RATIOS[type];
    const size = getNodeSizeForAspectRatio(type, aspectRatio);
    const node: ProjectNode = {
      id: crypto.randomUUID(),
      type,
      x: cx - size.width / 2,
      y: cy - size.height / 2,
      width: size.width,
      height: size.height,
      data: aspectRatio ? { aspectRatio } : {},
    };
    updateNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
  }

  function handleMoveNode(id: string, x: number, y: number) {
    updateNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  }

  function handleDeleteNode(id: string) {
    updateNodes((prev) =>
      prev
        .filter((n) => n.id !== id)
        .map((n) => {
          const conns = n.data.connections?.filter(
            (c) => c.sourceNodeId !== id
          );
          if (conns && conns.length !== (n.data.connections?.length ?? 0)) {
            return {
              ...n,
              data: {
                ...n.data,
                connections: conns.length > 0 ? conns : undefined,
              },
            };
          }
          return n;
        })
    );
    if (selectedNodeId === id) setSelectedNodeId(null);
  }

  function handleNodeDataChange(id: string, data: Partial<ProjectNodeData>) {
    updateNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const newData = { ...n.data, ...data };
        let newWidth = n.width;
        let newHeight = n.height;

        // Auto-resize when aspect ratio changes
        if (data.aspectRatio && (n.type === "IMAGE" || n.type === "VIDEO")) {
          const nextSize = getNodeSizeForAspectRatio(n.type, data.aspectRatio);
          newWidth = nextSize.width;
          newHeight = nextSize.height;
        }

        return { ...n, width: newWidth, height: newHeight, data: newData };
      })
    );
  }

  // ── Helpers ──
  function getNodeOutputUrl(node: ProjectNode): string | null {
    return node.data.outputUrl ?? node.data.fileUrl ?? null;
  }

  function loadImageDimensions(url: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => reject(new Error("Failed to load image dimensions"));
      img.src = url;
    });
  }

  function isKlingSupportedImageType(fileType?: string, fileName?: string) {
    const normalizedType = fileType?.toLowerCase();
    if (normalizedType === "image/png" || normalizedType === "image/jpeg") {
      return true;
    }

    const lowerName = fileName?.toLowerCase() ?? "";
    return lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");
  }

  function isImageSourceNode(node: ProjectNode) {
    if (node.type === "IMAGE") return true;

    const normalizedType = node.data.fileType?.toLowerCase();
    if (normalizedType?.startsWith("image/")) {
      return true;
    }

    const lowerName = node.data.fileName?.toLowerCase() ?? "";
    return (
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp")
    );
  }

  function isVideoSourceNode(node: ProjectNode) {
    if (node.type === "VIDEO") return true;

    const normalizedType = node.data.fileType?.toLowerCase();
    if (normalizedType?.startsWith("video/")) {
      return true;
    }

    const lowerName = node.data.fileName?.toLowerCase() ?? "";
    return (
      lowerName.endsWith(".mp4") ||
      lowerName.endsWith(".mov") ||
      lowerName.endsWith(".webm") ||
      lowerName.endsWith(".m4v")
    );
  }

  function handleConnectedAdd(
    type: "IMAGE" | "VIDEO",
    sourceNodeId: string,
    side: "left" | "right"
  ) {
    const source = nodes.find((n) => n.id === sourceNodeId);
    if (!source) return;

    const aspectRatio = DEFAULT_NODE_ASPECT_RATIOS[type];
    const size = getNodeSizeForAspectRatio(type, aspectRatio);
    const gap = 80;
    const newX =
      side === "right"
        ? source.x + source.width + gap
        : source.x - size.width - gap;
    const newY = source.y + (source.height - size.height) / 2;

    const conn: NodeConnection = { sourceNodeId, role: "primary" };

    const node: ProjectNode = {
      id: crypto.randomUUID(),
      type,
      x: newX,
      y: newY,
      width: size.width,
      height: size.height,
      data: {
        ...(aspectRatio ? { aspectRatio } : {}),
        connections: [conn],
      },
    };
    updateNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
    setConnectionMenu(null);
  }

  function handleDisconnect(nodeId: string, sourceNodeId: string) {
    updateNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const conns = (n.data.connections ?? []).filter(
          (c) => c.sourceNodeId !== sourceNodeId
        );
        return {
          ...n,
          data: { ...n.data, connections: conns.length > 0 ? conns : undefined },
        };
      })
    );
  }

  function getUploadNodePlacement(targetNode: ProjectNode, role: NodeConnection["role"]) {
    const size = DEFAULT_NODE_SIZES.UPLOAD;
    const gap = 80;
    const baseX = targetNode.x - size.width - gap;

    if (role === "endFrame") {
      return {
        x: baseX,
        y: targetNode.y + Math.max(0, targetNode.height - size.height),
      };
    }

    if (role === "referenceVideo") {
      return {
        x: baseX,
        y: targetNode.y + Math.round((targetNode.height - size.height) / 2),
      };
    }

    return {
      x: baseX,
      y: targetNode.y,
    };
  }

  async function handleInlineSourceUpload(
    targetNodeId: string,
    role: NodeConnection["role"],
    file: File
  ) {
    const uploaded = await uploadProjectMedia(file);

    updateNodes((prev) => {
      const targetNode = prev.find((node) => node.id === targetNodeId);
      if (!targetNode) {
        return prev;
      }

      const position = getUploadNodePlacement(targetNode, role);
      const uploadNodeId = crypto.randomUUID();
      const uploadNode: ProjectNode = {
        id: uploadNodeId,
        type: "UPLOAD",
        x: position.x,
        y: position.y,
        width: DEFAULT_NODE_SIZES.UPLOAD.width,
        height: DEFAULT_NODE_SIZES.UPLOAD.height,
        data: uploaded,
      };

      const nextNodes = prev.map((node) => {
        if (node.id !== targetNodeId) return node;

        const existingConnections = node.data.connections ?? [];
        const nextConnections = [
          ...existingConnections.filter((connection) => connection.role !== role),
          { sourceNodeId: uploadNodeId, role },
        ];

        return {
          ...node,
          data: {
            ...node.data,
            connections: nextConnections,
          },
        };
      });

      return [...nextNodes, uploadNode];
    });
  }

  // ── Screen ↔ Canvas coordinate conversion ──
  function screenToCanvas(screenX: number, screenY: number) {
    const container = canvasContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const transformDivs = container.querySelectorAll("[data-canvas-bg]");
    const transformDiv = transformDivs[transformDivs.length - 1] as HTMLElement | undefined;
    if (!transformDiv) return { x: 0, y: 0 };
    const matrix = new DOMMatrix(getComputedStyle(transformDiv).transform);
    const rect = container.getBoundingClientRect();
    return {
      x: (screenX - rect.left - matrix.e) / matrix.a,
      y: (screenY - rect.top - matrix.f) / matrix.a,
    };
  }

  function findNodeAtPosition(cx: number, cy: number, excludeId: string): ProjectNode | null {
    const labelH = 24;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.id === excludeId) continue;
      if (
        cx >= n.x &&
        cx <= n.x + n.width &&
        cy >= n.y &&
        cy <= n.y + labelH + n.height
      ) {
        return n;
      }
    }
    return null;
  }

  function handleConnectNodes(sourceNodeId: string, targetNode: ProjectNode) {
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    const existingConns = targetNode.data.connections ?? [];
    if (!sourceNode) return;
    if (existingConns.some((c) => c.sourceNodeId === sourceNodeId)) return;
    if (sourceNodeId === targetNode.id) return;

    if (targetNode.type === "VIDEO") {
      const selectedModelId = targetNode.data.model ?? VIDEO_MODEL_LIST[0]?.id;
      const selectedModel =
        VIDEO_MODEL_LIST.find((model) => model.id === selectedModelId) ??
        VIDEO_MODEL_LIST[0];
      const sourceIsImage = isImageSourceNode(sourceNode);
      const sourceIsVideo = isVideoSourceNode(sourceNode);
      const hasPrimary = existingConns.some((c) => c.role === "primary");
      const hasEndFrame = existingConns.some((c) => c.role === "endFrame");
      const hasReferenceVideo = existingConns.some(
        (c) => c.role === "referenceVideo"
      );

      let role: NodeConnection["role"] | null = null;

      if (selectedModelId === "kling3_motion") {
        if (sourceIsImage && !hasPrimary) {
          role = "primary";
        } else if (sourceIsVideo && !hasReferenceVideo) {
          role = "referenceVideo";
        }
      } else if (selectedModel?.supportsFirstLastFrames) {
        if (!sourceIsImage) return;
        role = hasPrimary && !hasEndFrame ? "endFrame" : !hasPrimary ? "primary" : null;
      } else if (selectedModel?.inputMode === "image") {
        if (!sourceIsImage || hasPrimary) return;
        role = "primary";
      } else if (selectedModel?.inputMode === "video") {
        if (!sourceIsVideo || hasPrimary) return;
        role = "primary";
      } else {
        return;
      }

      if (!role) {
        return;
      }

      handleNodeDataChange(targetNode.id, {
        connections: [...existingConns, { sourceNodeId, role }],
      });
      return;
    }

    if (!isImageSourceNode(sourceNode)) {
      return;
    }

    // Image nodes may accept multiple references.
    handleNodeDataChange(targetNode.id, {
      connections: [...existingConns, { sourceNodeId, role: "primary" }],
    });
  }

  function handlePlusDragStart(
    sourceNodeId: string,
    side: "left" | "right",
    e: React.MouseEvent
  ) {
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    function onMouseMove(ev: globalThis.MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        isDragging = true;
      }
      if (isDragging) {
        const pos = screenToCanvas(ev.clientX, ev.clientY);
        setDragConn({ sourceNodeId, side, cursorX: pos.x, cursorY: pos.y });
      }
    }

    function onMouseUp(ev: globalThis.MouseEvent) {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (isDragging) {
        const pos = screenToCanvas(ev.clientX, ev.clientY);
        const target = findNodeAtPosition(pos.x, pos.y, sourceNodeId);
        if (target && (target.type === "IMAGE" || target.type === "VIDEO")) {
          handleConnectNodes(sourceNodeId, target);
        }
        setDragConn(null);
      } else {
        // Click without drag → show connection menu to create new node
        setConnectionMenu({
          sourceNodeId,
          side,
          screenX: ev.clientX,
          screenY: ev.clientY,
        });
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  // ── Generation ──
  function getNodeModelInfo(node: ProjectNode) {
    if (node.type === "VIDEO") {
      const list = VISIBLE_VIDEO_MODEL_LIST;
      const modelId = node.data.model ?? list[0].id;
      const meta =
        VIDEO_MODEL_LIST.find((m) => m.id === modelId) ??
        VIDEO_MODEL_LIST.find((m) => m.id === getPreferredVideoModelId(list[0].id)) ??
        VIDEO_MODEL_LIST[0];
      // Dynamic pricing for video
      const resolution = node.data.resolution ?? meta.defaultResolution;
      const durationStr = node.data.duration ?? meta.defaultDuration;
      const durationSec = parseInt(durationStr, 10) || undefined;
      const dynamicCoins = getVideoModelCoins(modelId, resolution, durationSec) ?? meta.coins;
      return { list, modelId, meta: { ...meta, coins: dynamicCoins } };
    }
    const list = IMAGE_MODEL_LIST;
    const modelId = node.data.model ?? list[0].id;
    const meta = list.find((m) => m.id === modelId) ?? list[0];
    const quality = node.data.quality;
    const dynamicCoins = getImageModelCoins(modelId, quality) ?? meta.coins;
    return { list, modelId, meta: { ...meta, coins: dynamicCoins } };
  }

  function handleVideoModelSelection(
    node: ProjectNode,
    nextModelId: string,
    options?: { preferDefaultVariant?: boolean }
  ) {
    const resolvedModelId = options?.preferDefaultVariant
      ? getPreferredVideoModelId(nextModelId)
      : nextModelId;
    const videoModel =
      VIDEO_MODEL_LIST.find((item) => item.id === resolvedModelId) ??
      VIDEO_MODEL_LIST[0];
    const nextConnections = (node.data.connections ?? []).filter((connection) => {
      if (connection.role === "referenceVideo") {
        return videoModel.id === "kling3_motion";
      }

      if (connection.role === "endFrame") {
        return Boolean(videoModel.supportsFirstLastFrames);
      }

      if (connection.role === "primary") {
        return (
          videoModel.id === "kling3_motion" ||
          Boolean(videoModel.supportsFirstLastFrames) ||
          videoModel.inputMode === "image" ||
          videoModel.inputMode === "video"
        );
      }

      return true;
    });

    handleNodeDataChange(node.id, {
      model: resolvedModelId,
      resolution: videoModel.defaultResolution || undefined,
      duration: videoModel.defaultDuration || undefined,
      audio: videoModel.supportsAudio ? node.data.audio : false,
      multiShot: videoModel.supportsMultiShot ? node.data.multiShot : false,
      connections: nextConnections.length > 0 ? nextConnections : undefined,
      aspectRatio:
        videoModel.aspectRatios.length > 0
          ? (videoModel.defaultAspectRatio || videoModel.aspectRatios[0])
          : node.data.aspectRatio,
    });
  }

  async function handleGenerate(node: ProjectNode) {
    const isGen = node.type === "IMAGE" || node.type === "VIDEO";
    if (!isGen || generating) return;
    setGenerating(true);
    setError(null);

    const promptValue =
      (selectedNodeId === node.id ? prompt : node.data.prompt ?? "").trim();
    const { modelId, meta } = getNodeModelInfo(node);
    const defaultAR = node.type === "VIDEO"
      ? (VIDEO_MODEL_LIST.find((m) => m.id === modelId)?.defaultAspectRatio || "16:9")
      : "1:1";
    const ar = node.data.aspectRatio ?? defaultAR;
    const quality = node.data.quality;
    // Persist aspect ratio so pollStatus can resize the node after generation
    handleNodeDataChange(node.id, { prompt: promptValue, model: modelId, aspectRatio: ar });

    try {
      const options: Record<string, string> = { aspectRatio: ar };
      if (node.type === "IMAGE" && quality) {
        options.quality = quality;
      }
      if (node.type === "VIDEO") {
        const vmeta = VIDEO_MODEL_LIST.find((m) => m.id === modelId);
        options.resolution = node.data.resolution ?? (vmeta?.defaultResolution || "720p");
        options.duration = node.data.duration ?? (vmeta?.defaultDuration || "5s");
        options.audio = String(node.data.audio ?? false);
        options.multiShot = String(node.data.multiShot ?? false);
      }

      // Resolve reference images from connections
      const imageUrls: string[] = [];
      let imageUrl: string | undefined;
      let endFrameUrl: string | undefined;
      let videoUrl: string | undefined;
      let startFrameNode: ProjectNode | null = null;
      let endFrameNode: ProjectNode | null = null;
      let sourceVideoNode: ProjectNode | null = null;
      const conns = node.data.connections ?? [];
      for (const conn of conns) {
        const srcNode = nodes.find((n) => n.id === conn.sourceNodeId);
        if (!srcNode) continue;
        const url = getNodeOutputUrl(srcNode);
        if (!url) continue;

        if (node.type === "IMAGE") {
          imageUrls.push(url);
          continue;
        }

        if (conn.role === "referenceVideo") {
          videoUrl = url;
          sourceVideoNode = srcNode;
          continue;
        }

        if (conn.role === "primary") {
          if (isVideoSourceNode(srcNode)) {
            videoUrl = url;
            sourceVideoNode = srcNode;
          } else {
            imageUrl = url;
            startFrameNode = srcNode;
          }
        }
        if (conn.role === "endFrame") {
          endFrameUrl = url;
          endFrameNode = srcNode;
        }
      }

      if (node.type === "IMAGE" && !promptValue) {
        setError("პრომპტი აუცილებელია");
        return;
      }

      const selectedVideoModel =
        node.type === "VIDEO" ? VIDEO_MODEL_LIST.find((m) => m.id === modelId) : null;

      if (node.type === "VIDEO") {
        const motionReady = modelId === "kling3_motion" && Boolean(imageUrl) && Boolean(videoUrl);
        const hasKlingFrames = modelId === "kling3" && Boolean(imageUrl || endFrameUrl);
        const supportsFirstLastFrames = Boolean(selectedVideoModel?.supportsFirstLastFrames);

        if (!promptValue && !motionReady && !hasKlingFrames) {
          setError("პრომპტი აუცილებელია");
          return;
        }

        if (selectedVideoModel?.inputMode === "image" && !supportsFirstLastFrames && !imageUrl) {
          setError(
            modelId === "kling3_motion"
              ? "Kling 3.0 Motion-ს სჭირდება პერსონაჟის საწყისი სურათი"
              : "არჩეულ ვიდეო მოდელს სჭირდება საწყისი სურათი"
          );
          return;
        }

        if (modelId === "kling3_motion" && !videoUrl) {
          setError("Kling 3.0 Motion-ს სჭირდება რეფერენს ვიდეო");
          return;
        }

        if (selectedVideoModel?.inputMode === "video" && !videoUrl) {
          setError("არჩეულ ვიდეო მოდელს სჭირდება საწყისი ვიდეო");
          return;
        }

        if (selectedVideoModel?.inputMode === "video" && sourceVideoNode?.type === "UPLOAD") {
          const normalizedType = sourceVideoNode.data.fileType?.toLowerCase();
          if (!normalizedType?.startsWith("video/")) {
            setError("ვიდეო მოდელისთვის ატვირთული წყარო უნდა იყოს ვიდეო ფაილი");
            return;
          }
        }
      }

      if (node.type === "VIDEO" && modelId === "kling3" && imageUrl) {
        try {
          if (
            startFrameNode?.type === "UPLOAD" &&
            !isKlingSupportedImageType(startFrameNode.data.fileType, startFrameNode.data.fileName)
          ) {
            setError("Kling 3.0-ის კადრები უნდა იყოს PNG ან JPG ფორმატში");
            return;
          }

          if (
            endFrameNode?.type === "UPLOAD" &&
            !isKlingSupportedImageType(endFrameNode.data.fileType, endFrameNode.data.fileName)
          ) {
            setError("Kling 3.0-ის კადრები უნდა იყოს PNG ან JPG ფორმატში");
            return;
          }

          const framePairs = await Promise.all([
            loadImageDimensions(imageUrl),
            ...(endFrameUrl ? [loadImageDimensions(endFrameUrl)] : []),
          ]);

          const startFrame = framePairs[0];

          if (startFrame.width < 300 || startFrame.height < 300) {
            setError("Kling 3.0-ის საწყისი კადრი მინიმუმ 300x300 უნდა იყოს");
            return;
          }

          if (endFrameUrl) {
            const endFrame = framePairs[1];
            if (endFrame.width < 300 || endFrame.height < 300) {
              setError("Kling 3.0-ის ბოლო კადრი მინიმუმ 300x300 უნდა იყოს");
              return;
            }

            const startRatio = startFrame.width / startFrame.height;
            const endRatio = endFrame.width / endFrame.height;

            if (Math.abs(startRatio - endRatio) > 0.03) {
              setError("Kling 3.0-ის საწყისი და ბოლო კადრები ერთნაირი პროპორციით უნდა იყოს");
              return;
            }
          }
        } catch {
          // If dimensions cannot be resolved, let the API handle the request.
        }
      }

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          type: node.type,
          prompt: promptValue,
          options,
          ...(imageUrls.length > 0 ? { imageUrls } : {}),
          ...((selectedVideoModel?.inputMode === "image" || selectedVideoModel?.supportsFirstLastFrames) && imageUrl
            ? { imageUrl }
            : {}),
          ...(selectedVideoModel?.supportsFirstLastFrames && endFrameUrl ? { endFrameUrl } : {}),
          ...(videoUrl ? { videoUrl } : {}),
        }),
      });

      const result = (await res.json()) as {
        generationId?: string;
        error?: string;
      };

      if (!res.ok || !result.generationId) {
        setError(result.error ?? "გენერაცია ვერ შესრულდა");
        return;
      }

      setBalance((prev) => prev - meta.coins);
      handleNodeDataChange(node.id, {
        generationId: result.generationId,
        status: "PROCESSING",
      });
      pollStatus(result.generationId, node.id);
    } catch {
      setError("გენერაცია ვერ შესრულდა");
    } finally {
      setGenerating(false);
    }
  }

  function pollStatus(generationId: string, nodeId: string) {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/status/${generationId}`, {
          cache: "no-store",
        });
        const result = (await res.json()) as {
          status?: string;
          outputUrl?: string | null;
          errorMessage?: string | null;
        };

        if (result.status === "SUCCEEDED" && result.outputUrl) {
          // Keep the frame aligned with the selected aspect ratio.
          updateNodes((prev) =>
            prev.map((n) => {
              if (n.id !== nodeId) return n;
              const nextSize = getNodeSizeForAspectRatio(n.type, n.data.aspectRatio);
              return {
                ...n,
                width: nextSize.width,
                height: nextSize.height,
                data: { ...n.data, status: "SUCCEEDED", outputUrl: result.outputUrl },
              };
            })
          );
          scheduleSave();
          clearInterval(interval);
        } else if (result.status === "FAILED") {
          handleNodeDataChange(nodeId, { status: "FAILED" });
          setError(result.errorMessage ?? "გენერაცია ვერ შესრულდა");
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);
  }

  // ── Dropdown position: captured at click time so it works inside CSS transforms ──
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number } | null>(null);

  type ActiveDropdown = "model" | "variant" | "aspect" | "quality" | "resolution" | "duration" | null;
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);

  function openDropdown(type: ActiveDropdown, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPos({ x: rect.left, y: rect.top });
    setActiveDropdown(type);
  }

  function closeDropdown() {
    setActiveDropdown(null);
    setDropdownPos(null);
  }

  // ── Build prompt bar for a given node ──
  function renderPromptBar(node: ProjectNode) {
    const isGen = node.type === "IMAGE" || node.type === "VIDEO";
    if (!isGen) return null;

    const { modelId, meta } = getNodeModelInfo(node);
    const isProc =
      node.data.status === "PROCESSING" || node.data.status === "PENDING";

    // Per-model options
    const qualityOpts = QUALITY_OPTIONS[modelId] ?? [];
    let resolutionOpts: string[] = [];
    let durationOpts: string[] = [];
    let defaultAR = "1:1";

    if (node.type === "VIDEO") {
      const vmeta = VIDEO_MODEL_LIST.find((m) => m.id === modelId);
      resolutionOpts = vmeta?.resolutions ?? [];
      durationOpts = vmeta?.durations ?? [];
      defaultAR = vmeta?.defaultAspectRatio || "16:9";
    }

    const ar = node.data.aspectRatio ?? defaultAR;
    const quality = node.data.quality;
    const hasAspectOptions =
      node.type === "IMAGE" ||
      (VIDEO_MODEL_LIST.find((m) => m.id === modelId)?.aspectRatios.length ?? 0) > 0;
    const currentPromptValue =
      selectedNodeId === node.id ? prompt : node.data.prompt ?? "";
    const selectedVideoModel =
      node.type === "VIDEO"
        ? (VIDEO_MODEL_LIST.find((m) => m.id === modelId) ?? VIDEO_MODEL_LIST[0])
        : null;
    const parentVideoModel =
      selectedVideoModel?.hidden
        ? (VIDEO_MODEL_LIST.find((m) => m.variants?.some((variant) => variant.id === modelId)) ?? selectedVideoModel)
        : selectedVideoModel;
    const activeVariants = parentVideoModel?.variants ?? [];
    const activeVariantLabel =
      activeVariants.find((variant) => variant.id === modelId)?.label ??
      activeVariants[0]?.label ??
      null;
    const isKling3 = node.type === "VIDEO" && modelId === "kling3";
    const isMotionControl = node.type === "VIDEO" && modelId === "kling3_motion";
    const supportsFirstLastFrames = selectedVideoModel?.supportsFirstLastFrames ?? false;
    const needsImage = selectedVideoModel?.inputMode === "image";
    const needsVideo = selectedVideoModel?.inputMode === "video";
    const supportsAudio = selectedVideoModel?.supportsAudio ?? false;
    const supportsMultiShot = selectedVideoModel?.supportsMultiShot ?? false;
    const audioEnabled = node.data.audio ?? false;
    const multiShotEnabled = node.data.multiShot ?? false;

    const btnClass = (active: boolean) =>
      `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-brand-accent/15 text-brand-accent"
          : "text-white/50 hover:bg-white/5 hover:text-white/70"
      }`;

    const refs = (node.data.connections ?? [])
      .map((c) => {
        const src = nodes.find((n) => n.id === c.sourceNodeId);
        if (!src) return null;
        const url = getNodeOutputUrl(src);
        if (!url) return null;
        const isVideo = c.role === "referenceVideo" || isVideoSourceNode(src);
        const label =
          c.role === "referenceVideo"
            ? "რეფერენს ვიდეო"
            : node.type === "VIDEO" && c.role === "endFrame"
              ? "ბოლო კადრი"
              : node.type === "VIDEO" && isVideo
                ? "საწყისი ვიდეო"
                : node.type === "VIDEO"
                  ? "საწყისი კადრი"
                  : "რეფერენსი";
        return {
          sourceNodeId: c.sourceNodeId,
          url,
          label,
          isVideo,
          role: c.role,
        };
      })
      .filter(Boolean) as {
      sourceNodeId: string;
      url: string;
      label: string;
      isVideo: boolean;
      role: NodeConnection["role"];
    }[];

    const primaryImageRef =
      refs.find((r) => r.role === "primary" && !r.isVideo) ?? null;
    const endFrameRef =
      refs.find((r) => r.role === "endFrame" && !r.isVideo) ?? null;
    const primaryVideoRef =
      refs.find((r) => r.role === "referenceVideo" || (r.role === "primary" && r.isVideo)) ?? null;

    const promptRequired =
      node.type === "IMAGE"
        ? true
        : !(
            (isKling3 && Boolean(primaryImageRef || endFrameRef)) ||
            (isMotionControl && Boolean(primaryImageRef) && Boolean(primaryVideoRef))
          );

    const canGenerate =
      !generating &&
      !isProc &&
      (node.type === "IMAGE"
        ? Boolean(currentPromptValue.trim())
        : (!promptRequired || Boolean(currentPromptValue.trim())) &&
          (!needsImage || supportsFirstLastFrames || Boolean(primaryImageRef)) &&
          (!needsVideo || Boolean(primaryVideoRef)) &&
          (!isMotionControl || (Boolean(primaryImageRef) && Boolean(primaryVideoRef))));

    const sourceCards: React.ReactNode[] = [];

    if (node.type === "VIDEO") {
      if (isMotionControl) {
        sourceCards.push(
          <ProjectMediaInputCard
            key="character-image"
            title="პერსონაჟის სურათი"
            description="პერსონაჟის/ობიექტის ფოტო"
            emptyLabel="ატვირთე ან შეაერთე სურათის node"
            accept="image/jpeg,image/png,image/webp,image/avif"
            isVideo={false}
            mediaUrl={primaryImageRef?.url ?? null}
            onUpload={(file) => handleInlineSourceUpload(node.id, "primary", file)}
            onRemove={() => {
              if (primaryImageRef) handleDisconnect(node.id, primaryImageRef.sourceNodeId);
            }}
          />
        );
        sourceCards.push(
          <ProjectMediaInputCard
            key="reference-video"
            title="რეფერენს ვიდეო"
            description="მოძრაობის რეფერენსი (MP4)"
            emptyLabel="ატვირთე ან შეაერთე ვიდეო node"
            accept="video/mp4,video/webm,video/quicktime"
            isVideo
            mediaUrl={primaryVideoRef?.url ?? null}
            onUpload={(file) => handleInlineSourceUpload(node.id, "referenceVideo", file)}
            onRemove={() => {
              if (primaryVideoRef) handleDisconnect(node.id, primaryVideoRef.sourceNodeId);
            }}
          />
        );
      } else if (supportsFirstLastFrames) {
        sourceCards.push(
          <ProjectMediaInputCard
            key="start-frame"
            title="საწყისი კადრი"
            description="პირველი კადრი"
            emptyLabel="ატვირთე ან შეაერთე სურათის node"
            accept="image/jpeg,image/png,image/webp,image/avif"
            isVideo={false}
            mediaUrl={primaryImageRef?.url ?? null}
            onUpload={(file) => handleInlineSourceUpload(node.id, "primary", file)}
            onRemove={() => {
              if (primaryImageRef) handleDisconnect(node.id, primaryImageRef.sourceNodeId);
            }}
          />
        );
        sourceCards.push(
          <ProjectMediaInputCard
            key="end-frame"
            title="ბოლო კადრი"
            description="ბოლო კადრი"
            emptyLabel="ატვირთე ან შეაერთე სურათის node"
            accept="image/jpeg,image/png,image/webp,image/avif"
            isVideo={false}
            mediaUrl={endFrameRef?.url ?? null}
            onUpload={(file) => handleInlineSourceUpload(node.id, "endFrame", file)}
            onRemove={() => {
              if (endFrameRef) handleDisconnect(node.id, endFrameRef.sourceNodeId);
            }}
          />
        );
      } else if (needsImage) {
        sourceCards.push(
          <ProjectMediaInputCard
            key="source-image"
            title="საწყისი კადრი"
            description="ატვირთე საწყისი კადრი image-to-video რეჟიმისთვის"
            emptyLabel="ატვირთე ან შეაერთე სურათის node"
            accept="image/jpeg,image/png,image/webp,image/avif"
            isVideo={false}
            mediaUrl={primaryImageRef?.url ?? null}
            onUpload={(file) => handleInlineSourceUpload(node.id, "primary", file)}
            onRemove={() => {
              if (primaryImageRef) handleDisconnect(node.id, primaryImageRef.sourceNodeId);
            }}
          />
        );
      } else if (needsVideo) {
        sourceCards.push(
          <ProjectMediaInputCard
            key="source-video"
            title="საწყისი ვიდეო"
            description="ატვირთე წყარო video-to-video რეჟიმისთვის"
            emptyLabel="ატვირთე ან შეაერთე ვიდეო node"
            accept="video/mp4,video/webm,video/quicktime"
            isVideo
            mediaUrl={primaryVideoRef?.url ?? null}
            onUpload={(file) => handleInlineSourceUpload(node.id, "primary", file)}
            onRemove={() => {
              if (primaryVideoRef) handleDisconnect(node.id, primaryVideoRef.sourceNodeId);
            }}
          />
        );
      }
    }

    return (
      <div className="rounded-2xl border border-brand-accent/15 bg-[#161616]">
        {/* Error */}
        {error && selectedNodeId === node.id && (
          <div className="border-b border-brand-danger/20 bg-brand-danger/5 px-4 py-2 text-xs text-brand-danger">
            {error}
          </div>
        )}

        {sourceCards.length > 0 ? (
          <div className={`grid gap-2 border-b border-white/[0.06] px-4 py-3 ${
            sourceCards.length > 1 ? "sm:grid-cols-2" : ""
          }`}>
            {sourceCards}
          </div>
        ) : refs.length > 0 ? (
          <div className="flex gap-2 border-b border-white/[0.06] px-4 py-2.5">
            {refs.map((r) => (
              <div key={r.sourceNodeId} className="group relative">
                {r.isVideo ? (
                  <video
                    src={r.url}
                    className="size-12 rounded-lg border border-white/10 object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <>
                    {/* Remote user uploads are rendered directly in the canvas node preview. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.url}
                      alt={r.label}
                      className="size-12 rounded-lg border border-white/10 object-cover"
                    />
                  </>
                )}
                <span className="mt-0.5 block text-center text-[9px] text-white/30">
                  {r.label}
                </span>
                <button
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500/80 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnect(node.id, r.sourceNodeId);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Prompt */}
        {supportsMultiShot && (
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-sm text-white/75">მულტი-შოტი</p>
              <p className="text-xs text-white/35">სცენურ რეჟიმს ჩართავს</p>
            </div>
            <Switch
              checked={multiShotEnabled}
              onCheckedChange={(value) => handleNodeDataChange(node.id, { multiShot: value })}
              className="data-[state=checked]:bg-brand-accent"
            />
          </div>
        )}

        <div className="px-4 pb-2 pt-3.5">
          <textarea
            value={currentPromptValue}
            onChange={(e) => {
              setPrompt(e.target.value);
              handleNodeDataChange(node.id, { prompt: e.target.value });
            }}
            onFocus={() => setSelectedNodeId(node.id)}
            placeholder="აღწერე რისი გენერაცია გსურს..."
            rows={3}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-white/80 placeholder:text-white/25 focus:outline-none"
          />
          {supportsAudio && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                aria-label={audioEnabled ? "აუდიოს გამორთვა" : "აუდიოს ჩართვა"}
                aria-pressed={audioEnabled}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  audioEnabled
                    ? "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                    : "border-white/10 bg-white/[0.03] text-white/45"
                }`}
                onClick={() =>
                  handleNodeDataChange(node.id, { audio: !audioEnabled })
                }
              >
                <span>{audioEnabled ? "🔊" : "🔇"}</span>
                <span>აუდიო</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings row */}
        <div className="flex flex-wrap items-center gap-1 px-3 pb-3">
          {/* Model picker */}
          <button
            className={btnClass(activeDropdown === "model" && selectedNodeId === node.id)}
            onClick={(e) => {
              setSelectedNodeId(node.id);
              if (activeDropdown === "model") { closeDropdown(); return; }
              openDropdown("model", e);
            }}
          >
            {node.type === "VIDEO" ? (parentVideoModel?.name ?? meta.name) : meta.name}
          </button>

          {node.type === "VIDEO" && activeVariants.length > 1 && (
            <>
              <div className="mx-0.5 h-4 w-px bg-white/[0.08]" />
              <button
                className={btnClass(activeDropdown === "variant" && selectedNodeId === node.id)}
                onClick={(e) => {
                  setSelectedNodeId(node.id);
                  if (activeDropdown === "variant") { closeDropdown(); return; }
                  openDropdown("variant", e);
                }}
              >
                {activeVariantLabel}
              </button>
            </>
          )}

          {hasAspectOptions && <div className="mx-0.5 h-4 w-px bg-white/[0.08]" />}

          {/* Aspect ratio */}
          {hasAspectOptions && (
            <button
              className={btnClass(activeDropdown === "aspect" && selectedNodeId === node.id)}
              onClick={(e) => {
                setSelectedNodeId(node.id);
                if (activeDropdown === "aspect") { closeDropdown(); return; }
                openDropdown("aspect", e);
              }}
            >
              {ar}
            </button>
          )}

          {/* Quality picker (image models that support it) */}
          {node.type === "IMAGE" && qualityOpts.length > 0 && (
            <>
              <div className="mx-0.5 h-4 w-px bg-white/[0.08]" />
              <button
                className={btnClass(activeDropdown === "quality" && selectedNodeId === node.id)}
                onClick={(e) => {
                  setSelectedNodeId(node.id);
                  if (activeDropdown === "quality") { closeDropdown(); return; }
                  openDropdown("quality", e);
                }}
              >
                {quality ?? qualityOpts[qualityOpts.length - 1] ?? ""}
              </button>
            </>
          )}

          {/* Resolution picker (video only) */}
          {node.type === "VIDEO" && resolutionOpts.length > 0 && (
            <>
              <div className="mx-0.5 h-4 w-px bg-white/[0.08]" />
              <button
                className={btnClass(activeDropdown === "resolution" && selectedNodeId === node.id)}
                onClick={(e) => {
                  setSelectedNodeId(node.id);
                  if (activeDropdown === "resolution") { closeDropdown(); return; }
                  openDropdown("resolution", e);
                }}
              >
                {node.data.resolution ??
                  (VIDEO_MODEL_LIST.find((m) => m.id === modelId)?.defaultResolution || "720p")}
              </button>
            </>
          )}

          {/* Duration picker (video only) */}
          {node.type === "VIDEO" && durationOpts.length > 0 && (
            <>
              <div className="mx-0.5 h-4 w-px bg-white/[0.08]" />
              <button
                className={btnClass(activeDropdown === "duration" && selectedNodeId === node.id)}
                onClick={(e) => {
                  setSelectedNodeId(node.id);
                  if (activeDropdown === "duration") { closeDropdown(); return; }
                  openDropdown("duration", e);
                }}
              >
                {node.data.duration ??
                  (VIDEO_MODEL_LIST.find((m) => m.id === modelId)?.defaultDuration || "5s")}
              </button>
            </>
          )}

          <div className="flex-1" />

          {/* Cost + generate */}
          <span className="mr-1.5 rounded-full bg-brand-accent/10 px-2.5 py-1 text-xs tabular-nums text-brand-accent/70">
            ✦ {meta.coins}
          </span>
          <button
            disabled={!canGenerate}
            className="flex size-8 items-center justify-center rounded-full bg-brand-accent text-black transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => void handleGenerate(node)}
          >
            {generating || isProc ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </button>
        </div>

        {node.type === "VIDEO" && needsImage && !primaryImageRef && !supportsFirstLastFrames && !isMotionControl ? (
          <p className="px-4 pb-3 text-xs text-white/35">
            image-to-video მოდელისთვის საწყისი კადრი აუცილებელია.
          </p>
        ) : null}

        {node.type === "VIDEO" && isMotionControl && !primaryImageRef ? (
          <p className="px-4 pb-3 text-xs text-white/35">
            Motion Control-ისთვის პერსონაჟის სურათი აუცილებელია.
          </p>
        ) : null}

        {node.type === "VIDEO" && needsVideo && !primaryVideoRef ? (
          <p className="px-4 pb-3 text-xs text-white/35">
            ამ მოდელისთვის საწყისი ვიდეო აუცილებელია.
          </p>
        ) : null}
      </div>
    );
  }

  // ── Mobile guard ──
  if (isMobile) {
    return (
      <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 bg-brand-background px-6 text-center sm:-m-6">
        <Monitor className="size-12 text-brand-muted" />
        <p className="text-lg font-medium text-brand-secondary">
          პროექტების რედაქტორი ხელმისაწვდომია მხოლოდ დესკტოპზე
        </p>
        <p className="text-sm text-brand-muted">
          გთხოვთ გამოიყენოთ კომპიუტერი ან ტაბლეტი
        </p>
        <Link
          href="/ai-tools/projects"
          className="mt-2 text-sm text-brand-accent hover:underline"
        >
          უკან დაბრუნება
        </Link>
      </div>
    );
  }

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-[#0a0a0a] sm:-m-6 lg:-m-8">
      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#111] px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/ai-tools/projects"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            <ArrowLeft className="size-5" />
          </Link>

          {editingTitle ? (
            <input
              className="rounded border border-brand-accent/20 bg-white/5 px-2 py-1 text-sm font-medium text-white outline-none focus:border-brand-accent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleBlur();
              }}
              autoFocus
            />
          ) : (
            <button
              className="rounded px-2 py-1 text-sm font-medium text-white/80 transition-colors hover:bg-white/5"
              onClick={() => setEditingTitle(true)}
            >
              {title}
            </button>
          )}
        </div>

        <CreditDisplay compact balance={balance} />
      </div>

      {/* ── Canvas area ── */}
      <div ref={canvasContainerRef} className="relative flex-1 overflow-hidden">
        <Canvas
          zoom={zoom}
          onZoomChange={setZoom}
          svgOverlay={
            <ConnectionLines
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              dragLine={dragConn ? (() => {
                const src = nodes.find((n) => n.id === dragConn.sourceNodeId);
                if (!src) return null;
                const labelH = 24;
                const fromX = dragConn.side === "right" ? src.x + src.width : src.x;
                const fromY = src.y + labelH + src.height / 2;
                return { fromX, fromY, toX: dragConn.cursorX, toY: dragConn.cursorY };
              })() : null}
            />
          }
          onDoubleClick={(cx, cy, sx, sy) => {
            setDblClickMenu({ screenX: sx, screenY: sy, canvasX: cx, canvasY: cy });
          }}
          onBackgroundClick={() => {
            setSelectedNodeId(null);
            closeDropdown();
            setShowAddMenu(false);
            setDblClickMenu(null);
            setConnectionMenu(null);
          }}
        >
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              id={node.id}
              type={node.type}
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              zoom={zoom}
              selected={selectedNodeId === node.id}
              processing={
                node.data.status === "PROCESSING" ||
                node.data.status === "PENDING"
              }
              hasOutput={Boolean(getNodeOutputUrl(node))}
              onMove={handleMoveNode}
              onSelect={setSelectedNodeId}
              onDelete={handleDeleteNode}
              onPlusMouseDown={(side, e) =>
                handlePlusDragStart(node.id, side, e)
              }
              downloadUrl={
                node.type !== "UPLOAD" && node.data.outputUrl ? node.data.outputUrl : null
              }
              downloadFilename={
                node.type === "IMAGE"
                  ? `image-${node.id}.png`
                  : node.type === "VIDEO"
                    ? `video-${node.id}.mp4`
                    : undefined
              }
              promptBar={renderPromptBar(node)}
            >
              {node.type === "IMAGE" && <ImageNode data={node.data} />}
              {node.type === "VIDEO" && <VideoNode data={node.data} />}
              {node.type === "AUDIO" && <AudioNode />}
              {node.type === "UPLOAD" && (
                <UploadNode
                  data={node.data}
                  onDataChange={(data) => handleNodeDataChange(node.id, data)}
                />
              )}
            </NodeCard>
          ))}
        </Canvas>

        {/* ── Floating + button (left edge, vertically centered) ── */}
        <div className="absolute left-4 top-1/2 z-30 -translate-y-1/2">
          <button
            className={`flex size-11 items-center justify-center rounded-full shadow-lg transition-all ${
              showAddMenu
                ? "bg-brand-accent text-black shadow-brand-accent/20"
                : "bg-brand-accent text-black shadow-brand-accent/20 hover:shadow-brand-accent/30 hover:brightness-110"
            }`}
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            <Plus
              className={`size-5 transition-transform ${showAddMenu ? "rotate-45" : ""}`}
            />
          </button>

          {/* Add node dropdown */}
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute left-14 top-1/2 z-50 w-44 -translate-y-1/2 overflow-hidden rounded-xl border border-brand-accent/10 bg-[#1a1a1a] shadow-2xl">
                <div className="px-3 py-2 text-[11px] font-medium text-brand-accent/40">
                  ნოდის დამატება
                </div>
                {ADD_NODE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      disabled={item.disabled}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-brand-accent/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => addNode(item.type)}
                    >
                      <Icon className="size-4 text-brand-accent/50" />
                      {item.label}
                      {item.disabled && (
                        <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                          მალე
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Double-click context menu ── */}
        {dblClickMenu && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setDblClickMenu(null)}
            />
            <div
              className="fixed z-[9999] w-44 select-none overflow-hidden rounded-xl border border-brand-accent/10 bg-[#1a1a1a] shadow-2xl"
              style={{ left: dblClickMenu.screenX, top: dblClickMenu.screenY }}
            >
              <div className="px-3 py-2 text-[11px] font-medium text-brand-accent/40">
                ნოდის დამატება
              </div>
              {ADD_NODE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    disabled={item.disabled}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-brand-accent/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => {
                      handleAddNodeAtPosition(
                        item.type,
                        dblClickMenu.canvasX,
                        dblClickMenu.canvasY
                      );
                      setDblClickMenu(null);
                    }}
                  >
                    <Icon className="size-4 text-brand-accent/50" />
                    {item.label}
                    {item.disabled && (
                      <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                        მალე
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Connection menu ── */}
        {connectionMenu && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setConnectionMenu(null)}
            />
            <div
              className="fixed z-[9999] w-40 select-none overflow-hidden rounded-xl border border-brand-accent/10 bg-[#1a1a1a] shadow-2xl"
              style={{ left: connectionMenu.screenX, top: connectionMenu.screenY }}
            >
              <div className="px-3 py-2 text-[11px] font-medium text-brand-accent/40">
                დაკავშირება
              </div>
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-brand-accent/5 hover:text-white"
                onClick={() =>
                  handleConnectedAdd("IMAGE", connectionMenu.sourceNodeId, connectionMenu.side)
                }
              >
                <ImageIcon className="size-4 text-brand-accent/50" />
                სურათი
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-brand-accent/5 hover:text-white"
                onClick={() =>
                  handleConnectedAdd("VIDEO", connectionMenu.sourceNodeId, connectionMenu.side)
                }
              >
                <Video className="size-4 text-brand-accent/50" />
                ვიდეო
              </button>
            </div>
          </>
        )}

        {/* ── Fixed dropdown panels (rendered outside canvas transform) ── */}
        {activeDropdown && dropdownPos && selectedNode && (() => {
          const { list, modelId } = getNodeModelInfo(selectedNode);
          const quality = selectedNode.data.quality;
          const qualityOpts = QUALITY_OPTIONS[modelId] ?? [];
          const selectedVideoModel =
            selectedNode.type === "VIDEO"
              ? (VIDEO_MODEL_LIST.find((m) => m.id === modelId) ?? VIDEO_MODEL_LIST[0])
              : null;
          const selectedVideoParentModel =
            selectedVideoModel?.hidden
              ? (VIDEO_MODEL_LIST.find((m) => m.variants?.some((variant) => variant.id === modelId)) ?? selectedVideoModel)
              : selectedVideoModel;
          const activeVariants = selectedVideoParentModel?.variants ?? [];
          const selectedModelKey =
            selectedNode.type === "VIDEO"
              ? (selectedVideoParentModel?.id ?? modelId)
              : modelId;

          let aspectOpts: readonly string[];
          let resolutionOpts: string[] = [];
          let durationOpts: string[] = [];
          let defaultAR = "1:1";
          let defaultRes = "720p";
          let defaultDur = "5s";

          if (selectedNode.type === "VIDEO") {
            const vmeta = VIDEO_MODEL_LIST.find((m) => m.id === modelId);
            aspectOpts =
              vmeta?.aspectRatios && vmeta.aspectRatios.length > 0
                ? vmeta.aspectRatios
                : ["16:9", "9:16", "1:1"];
            resolutionOpts = vmeta?.resolutions ?? [];
            durationOpts = vmeta?.durations ?? [];
            defaultAR = vmeta?.defaultAspectRatio || "16:9";
            defaultRes = vmeta?.defaultResolution || "720p";
            defaultDur = vmeta?.defaultDuration || "5s";
          } else {
            aspectOpts = IMAGE_ASPECT_RATIO_OPTIONS[modelId] ?? DEFAULT_IMAGE_ASPECT_RATIOS;
          }

          const ar = selectedNode.data.aspectRatio ?? defaultAR;

          return (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={closeDropdown} />
              <div
                className="fixed z-[9999] select-none overflow-hidden rounded-xl border border-brand-accent/10 bg-[#1a1a1a] shadow-2xl"
                style={{ left: dropdownPos.x, bottom: window.innerHeight - dropdownPos.y + 8 }}
              >
                {activeDropdown === "model" && (
                  <div className="w-56 py-1 select-none">
                    {list.map((m) => (
                      <button
                        key={m.id}
                        className={`flex w-full select-none items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-brand-accent/5 ${
                          selectedModelKey === m.id
                            ? "bg-brand-accent/5 text-brand-accent"
                            : "text-white/70"
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (selectedNode.type === "VIDEO") {
                            handleVideoModelSelection(selectedNode, m.id, {
                              preferDefaultVariant: true,
                            });
                          } else {
                            const nextQualityOptions = QUALITY_OPTIONS[m.id] ?? [];
                            const nextAspectOptions =
                              IMAGE_ASPECT_RATIO_OPTIONS[m.id] ?? DEFAULT_IMAGE_ASPECT_RATIOS;
                            const currentQuality = selectedNode.data.quality;
                            const currentAspectRatio = selectedNode.data.aspectRatio;

                            handleNodeDataChange(selectedNode.id, {
                              model: m.id,
                              quality: nextQualityOptions.includes(currentQuality ?? "")
                                ? currentQuality
                                : (nextQualityOptions[nextQualityOptions.length - 1] ?? undefined),
                              aspectRatio: nextAspectOptions.includes(currentAspectRatio ?? "")
                                ? currentAspectRatio
                                : nextAspectOptions[0],
                            });
                          }
                          closeDropdown();
                        }}
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-white/30">{m.coins} ✦</span>
                      </button>
                    ))}
                  </div>
                )}

                {activeDropdown === "variant" && activeVariants.length > 1 && (
                  <div className="w-48 py-1 select-none">
                    {activeVariants.map((variant) => (
                      <button
                        key={variant.id}
                        className={`flex w-full select-none items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-brand-accent/5 ${
                          modelId === variant.id
                            ? "bg-brand-accent/5 text-brand-accent"
                            : "text-white/70"
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleVideoModelSelection(selectedNode, variant.id);
                          closeDropdown();
                        }}
                      >
                        <span className="font-medium">{variant.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {activeDropdown === "aspect" && (
                  <div className="flex max-w-72 select-none flex-wrap gap-1 p-2.5">
                    {aspectOpts.map((ratio) => (
                      <button
                        key={ratio}
                        className={`select-none rounded-lg px-3 py-1.5 text-xs transition-colors ${
                          ar === ratio
                            ? "bg-brand-accent/15 text-brand-accent"
                            : "text-white/45 hover:bg-white/5 hover:text-white/65"
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleNodeDataChange(selectedNode.id, { aspectRatio: ratio });
                          closeDropdown();
                        }}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                )}

                {activeDropdown === "quality" && (
                  <div className="flex select-none gap-1 p-2.5">
                    {qualityOpts.map((q) => (
                      <button
                        key={q}
                        className={`select-none rounded-lg px-3 py-1.5 text-xs transition-colors ${
                          (quality ?? qualityOpts[qualityOpts.length - 1]) === q
                            ? "bg-brand-accent/15 text-brand-accent"
                            : "text-white/45 hover:bg-white/5 hover:text-white/65"
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleNodeDataChange(selectedNode.id, { quality: q });
                          closeDropdown();
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {activeDropdown === "resolution" && (
                  <div className="flex select-none gap-1 p-2.5">
                    {resolutionOpts.map((r) => (
                      <button
                        key={r}
                        className={`select-none rounded-lg px-3 py-1.5 text-xs transition-colors ${
                          (selectedNode.data.resolution ?? defaultRes) === r
                            ? "bg-brand-accent/15 text-brand-accent"
                            : "text-white/45 hover:bg-white/5 hover:text-white/65"
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleNodeDataChange(selectedNode.id, { resolution: r });
                          closeDropdown();
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                {activeDropdown === "duration" && (() => {
                  const vmeta = VIDEO_MODEL_LIST.find((m) => m.id === modelId);
                  const hasPerSecond = !!vmeta?.coinsPerSecondByResolution;
                  const durNums = durationOpts.map((d) => parseInt(d, 10)).filter((n) => !isNaN(n));
                  const minDur = Math.min(...durNums);
                  const maxDur = Math.max(...durNums);
                  const curDur = parseInt(selectedNode.data.duration ?? defaultDur, 10) || minDur;

                  if (hasPerSecond && minDur !== maxDur) {
                    return (
                      <div className="w-56 p-3">
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>{minDur} წმ</span>
                          <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-2.5 py-1 text-brand-accent tabular-nums">
                            {curDur} წმ
                          </span>
                          <span>{maxDur} წმ</span>
                        </div>
                        <input
                          type="range"
                          min={minDur}
                          max={maxDur}
                          step={1}
                          value={curDur}
                          onChange={(e) => {
                            handleNodeDataChange(selectedNode.id, { duration: `${e.target.value}s` });
                          }}
                          className="mt-3 h-2 w-full cursor-pointer accent-[#F5A623]"
                        />
                      </div>
                    );
                  }

                  return (
                    <div className="flex gap-1 p-2.5">
                      {durationOpts.map((d) => (
                        <button
                          key={d}
                          className={`select-none rounded-lg px-3 py-1.5 text-xs transition-colors ${
                            (selectedNode.data.duration ?? defaultDur) === d
                              ? "bg-brand-accent/15 text-brand-accent"
                              : "text-white/45 hover:bg-white/5 hover:text-white/65"
                          }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            handleNodeDataChange(selectedNode.id, { duration: d });
                            closeDropdown();
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          );
        })()}

        {/* ── Zoom controls (bottom-left) ── */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#161616] px-3 py-1.5">
          <button
            className="text-white/40 transition-colors hover:text-white/70"
            onClick={() =>
              setZoom((z) =>
                Math.max(0.3, Math.round((z - 0.1) * 10) / 10)
              )
            }
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-10 text-center text-[11px] tabular-nums text-white/40">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="text-white/40 transition-colors hover:text-white/70"
            onClick={() =>
              setZoom((z) =>
                Math.min(2, Math.round((z + 0.1) * 10) / 10)
              )
            }
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* ── Empty state ── */}
        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-base text-white/20">
                ორჯერ დააკლიკე ელემენტის დასამატებლად
              </p>
              <p className="mt-1.5 text-sm text-brand-accent/30">
                ან გამოიყენე ყვითელი ღილაკი
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
