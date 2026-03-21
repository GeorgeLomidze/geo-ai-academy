export type AIHistoryItem = {
  id: string;
  modelId: string;
  modelName: string;
  prompt: string | null;
  aspectRatio?: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  outputUrl: string | null;
  errorMessage?: string | null;
  creditsUsed: number;
  createdAt: string;
  sourceUrl: string | null;
};
