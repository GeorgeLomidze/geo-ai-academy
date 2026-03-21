export type NodeType = "IMAGE" | "VIDEO" | "AUDIO" | "UPLOAD";

export interface NodeConnection {
  sourceNodeId: string;
  role: "primary" | "endFrame" | "referenceVideo";
}

export interface ProjectNodeData {
  model?: string;
  prompt?: string;
  outputUrl?: string | null;
  status?: string;
  generationId?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  quality?: string;
  resolution?: string;
  duration?: string;
  audio?: boolean;
  multiShot?: boolean;
  connections?: NodeConnection[];
}

export interface ProjectNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  data: ProjectNodeData;
}

export interface ProjectSummary {
  id: string;
  title: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}
