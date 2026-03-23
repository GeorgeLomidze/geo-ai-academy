export type AIHistoryItem = {
  id: string;
  modelId: string;
  modelName: string;
  type?: "IMAGE" | "VIDEO" | "AUDIO";
  prompt: string | null;
  aspectRatio?: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  outputUrl: string | null;
  outputText?: string | null;
  outputData?: unknown;
  errorMessage?: string | null;
  creditsUsed: number;
  createdAt: string;
  sourceUrl: string | null;
};
