import { ApiError } from "@/lib/api-error";
import { logDebug } from "@/lib/logger";
import { refundKieGenerationCredits, type KieRefundContext } from "@/lib/kie/callback";

const KIE_API_BASE_URL = "https://api.kie.ai/api/v1";
const KIE_CREATE_TASK_PATH = "/jobs/createTask";
const KIE_TASK_STATUS_PATH = "/jobs/recordInfo";

type KieTaskType = "image" | "video";
type KieTaskMode =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "video-to-video";

type KieModelConfig = {
  taskType: KieTaskType;
  taskMode: KieTaskMode;
  kieModel: string;
  defaults?: Record<string, unknown>;
  mediaInputKey?: "image_url" | "image_urls" | "image_input" | "input_urls" | "video_url";
  /** Custom endpoint path (if not using the standard /jobs/createTask) */
  endpoint?: string;
  /** Custom status endpoint path (if not using /jobs/recordInfo) */
  statusEndpoint?: string;
  /** If true, the request body is flat (not wrapped in { model, input }) */
  flatBody?: boolean;
};

type KieRequestEnvelope = {
  model: string;
  callBackUrl?: string;
  input: Record<string, unknown>;
};

type KieApiResponse<T> = {
  code?: number;
  msg?: string;
  message?: string;
  data?: T;
};

type KieCreateTaskData = {
  taskId?: string;
  id?: string;
};

type KieTaskStatusData = {
  taskId?: string;
  state?: string;
  /** GPT Image / Flux use `status` instead of `state` */
  status?: string;
  /** Flux / Veo uses successFlag: 0=generating, 1=success, 2=create failed, 3=generate failed */
  successFlag?: number;
  model?: string;
  failMsg?: string;
  errorMessage?: string;
  resultJson?: string;
  response?: {
    result_urls?: string[];
    resultUrls?: string[];
    resultImageUrl?: string;
    originImageUrl?: string;
  };
  /** Runway uses videoInfo for results */
  videoInfo?: {
    videoId?: string;
    videoUrl?: string;
    imageUrl?: string;
  };
  /** Runway uses expireFlag (0=active, 1=expired) */
  expireFlag?: number;
};

export type KieTaskStatusResult = {
  taskId: string;
  type: KieTaskType;
  state: string;
  success: boolean;
  resultUrls: string[];
  errorMessage?: string;
  raw: KieTaskStatusData;
};

export type KieCreateTaskResult = {
  taskId: string;
  type: KieTaskType;
  model: string;
  kieModel: string;
  raw: KieApiResponse<KieCreateTaskData>;
};

export type KieTaskOptions = {
  callBackUrl?: string;
  input?: Record<string, unknown>;
  refund?: KieRefundContext;
};

export class KieApiError extends Error {
  statusCode?: number;
  details?: unknown;

  constructor(message: string, options?: { statusCode?: number; details?: unknown }) {
    super(message);
    this.name = "KieApiError";
    this.statusCode = options?.statusCode;
    this.details = options?.details;
  }
}

const KIE_MODELS = {
  // ─── Image models ───
  nanobanana: {
    taskType: "image",
    taskMode: "text-to-image",
    kieModel: "google/nano-banana",
    defaults: {
      output_format: "png",
    },
  },
  nanobanana_edit: {
    taskType: "image",
    taskMode: "image-to-image",
    kieModel: "google/nano-banana-edit",
    mediaInputKey: "image_urls",
  },
  nanobanana2: {
    taskType: "image",
    taskMode: "text-to-image",
    kieModel: "nano-banana-2",
    defaults: {
      google_search: false,
      image_input: [],
      output_format: "jpg",
    },
  },
  nanobanana2_edit: {
    taskType: "image",
    taskMode: "image-to-image",
    kieModel: "nano-banana-2",
    defaults: {
      google_search: false,
      output_format: "jpg",
    },
    mediaInputKey: "image_input",
  },
  nanobananapro: {
    taskType: "image",
    taskMode: "text-to-image",
    kieModel: "nano-banana-pro",
    defaults: {
      image_input: [],
      output_format: "png",
    },
  },
  nanobananapro_edit: {
    taskType: "image",
    taskMode: "image-to-image",
    kieModel: "nano-banana-pro",
    defaults: {
      output_format: "png",
    },
    mediaInputKey: "image_input",
  },
  seedream5lite: {
    taskType: "image",
    taskMode: "text-to-image",
    kieModel: "seedream/5-lite-text-to-image",
  },
  seedream5lite_edit: {
    taskType: "image",
    taskMode: "image-to-image",
    kieModel: "seedream/5-lite-image-to-image",
    mediaInputKey: "image_urls",
  },
  grok_t2i: {
    taskType: "image",
    taskMode: "text-to-image",
    kieModel: "grok-imagine/text-to-image",
  },
  grok_i2i: {
    taskType: "image",
    taskMode: "image-to-image",
    kieModel: "grok-imagine/image-to-image",
    mediaInputKey: "image_urls",
  },
  openaiimage: {
    taskType: "image",
    taskMode: "text-to-image",
    kieModel: "gpt-4o-image",
    endpoint: "/gpt4o-image/generate",
    statusEndpoint: "/gpt4o-image/record-info",
    flatBody: true,
  },
  flux: {
    taskType: "image",
    taskMode: "text-to-image",
    kieModel: "flux-kontext-pro",
    endpoint: "/flux/kontext/generate",
    statusEndpoint: "/flux/kontext/record-info",
    flatBody: true,
  },

  // ─── Video models ───
  grok_t2v: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "grok-imagine/text-to-video",
  },
  grok_i2v: {
    taskType: "video",
    taskMode: "image-to-video",
    kieModel: "grok-imagine/image-to-video",
    mediaInputKey: "image_urls",
  },
  grok_upscale: {
    taskType: "video",
    taskMode: "video-to-video",
    kieModel: "grok-imagine/video-upscale",
    mediaInputKey: "video_url",
  },
  veo31: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "veo3",
    endpoint: "/veo/generate",
    statusEndpoint: "/veo/record-info",
    flatBody: true,
  },
  veo31fast: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "veo3_fast",
    endpoint: "/veo/generate",
    statusEndpoint: "/veo/record-info",
    flatBody: true,
  },
  sora2: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "sora-2-text-to-video",
  },
  sora2pro: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "sora-2-pro-text-to-video",
  },
  kling3: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "kling-3.0/video",
  },
  seedance: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "bytedance/seedance-1.5-pro",
  },
  wan: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "wan/2-6-text-to-video",
  },
  runway: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "runway-gen4",
    endpoint: "/runway/generate",
    statusEndpoint: "/runway/record-detail",
    flatBody: true,
  },
  minimax: {
    taskType: "video",
    taskMode: "text-to-video",
    kieModel: "hailuo/02-text-to-video-standard",
  },
  topaz_upscale: {
    taskType: "video",
    taskMode: "video-to-video",
    kieModel: "topaz/video-upscale",
    mediaInputKey: "video_url",
  },
  kling3_motion: {
    taskType: "video",
    taskMode: "image-to-video",
    kieModel: "kling-3.0/motion-control",
    mediaInputKey: "input_urls",
  },
  infinitalk: {
    taskType: "video",
    taskMode: "image-to-video",
    kieModel: "infinitalk/from-audio",
    mediaInputKey: "image_url",
  },
} as const satisfies Record<string, KieModelConfig>;

type KieModelId = keyof typeof KIE_MODELS;

function getApiKey() {
  const apiKey = process.env.KIE_AI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "Kie.ai API გასაღები არ არის კონფიგურირებული");
  }

  return apiKey;
}

function getModelConfig(modelId: string): KieModelConfig {
  const config = KIE_MODELS[modelId as KieModelId];

  if (!config) {
    throw new KieApiError(`Unsupported Kie.ai model id: ${modelId}`);
  }

  return config;
}

export function getKieModelConfig(modelId: string) {
  return getModelConfig(modelId);
}

/** Map UI quality values (1K/2K/4K) to Seedream quality values */
function mapSeedreamQuality(quality: string) {
  if (quality === "4K") return "high";
  return "basic";
}

function normalizeImageInputOptions(
  modelId: string,
  input?: Record<string, unknown>
) {
  if (!input) {
    return {};
  }

  const { aspectRatio, quality, ...rest } = input;
  const normalized: Record<string, unknown> = { ...rest };

  if (typeof aspectRatio === "string" && aspectRatio.length > 0) {
    if (
      modelId === "nanobanana" ||
      modelId === "nanobanana_edit"
    ) {
      normalized.image_size = aspectRatio;
    } else if (
      modelId === "nanobanana2" ||
      modelId === "nanobanana2_edit" ||
      modelId === "nanobananapro" ||
      modelId === "nanobananapro_edit"
    ) {
      normalized.aspect_ratio = aspectRatio;
    } else if (modelId === "openaiimage") {
      normalized.size = aspectRatio;
    } else if (modelId === "flux") {
      normalized.aspectRatio = aspectRatio;
    } else {
      normalized.aspect_ratio = aspectRatio;
    }
  }

  if (typeof quality === "string" && quality.length > 0) {
    if (modelId === "nanobanana2" || modelId === "nanobanana2_edit" || modelId === "nanobananapro" || modelId === "nanobananapro_edit") {
      normalized.resolution = quality;
    } else if (modelId === "seedream5lite" || modelId === "seedream5lite_edit") {
      normalized.quality = mapSeedreamQuality(quality);
    }
  } else if (modelId === "seedream5lite" || modelId === "seedream5lite_edit") {
    // Seedream requires quality — default to "basic" if not provided
    normalized.quality = "basic";
  }

  return normalized;
}

/** Normalize video generation options for each model's expected API format */
function normalizeVideoInputOptions(
  modelId: string,
  input?: Record<string, unknown>
) {
  if (!input) {
    return {};
  }

  const {
    aspectRatio,
    resolution,
    duration,
    audio,
    multiShot,
    ...rest
  } = input;
  const normalized: Record<string, unknown> = { ...rest };

  const durationStr = typeof duration === "string"
    ? duration.replace("s", "")
    : typeof duration === "number"
      ? String(duration)
      : undefined;

  switch (modelId) {
    case "grok_t2v":
    case "grok_i2v": {
      if (aspectRatio) normalized.aspect_ratio = aspectRatio;
      if (resolution) normalized.resolution = resolution;
      if (durationStr) normalized.duration = durationStr;
      if (audio) normalized.sound = true;
      break;
    }

    case "veo31":
    case "veo31fast": {
      // Veo uses flat body — model is injected separately
      if (aspectRatio) normalized.aspect_ratio = aspectRatio;
      if (durationStr) normalized.duration = Number(durationStr);
      break;
    }

    case "sora2":
    case "sora2pro": {
      // Sora uses landscape/portrait instead of 16:9/9:16
      if (aspectRatio === "9:16") {
        normalized.aspect_ratio = "portrait";
      } else {
        normalized.aspect_ratio = "landscape";
      }
      // Sora uses n_frames for duration (10 = ~5s, 15 = ~10s)
      if (durationStr) {
        const sec = Number(durationStr);
        normalized.n_frames = sec <= 5 ? "10" : "15";
      }
      normalized.remove_watermark = true;
      break;
    }

    case "kling3": {
      const hasFrameImages =
        Array.isArray(rest.image_urls) && rest.image_urls.length > 0;
      if (aspectRatio && !hasFrameImages) normalized.aspect_ratio = aspectRatio;
      if (durationStr) normalized.duration = durationStr;
      // Kling uses mode=std for 720p, mode=pro for 1080p
      if (resolution === "1080p") {
        normalized.mode = "pro";
      } else {
        normalized.mode = "std";
      }
      normalized.sound = Boolean(audio);
      normalized.multi_shots = Boolean(multiShot);
      break;
    }

    case "seedance": {
      if (aspectRatio) normalized.aspect_ratio = aspectRatio;
      if (resolution) normalized.resolution = resolution;
      // Seedance 1.5 pro uses integer durations: 4, 8, 12
      if (durationStr) {
        const sec = Number(durationStr);
        if (sec <= 4) normalized.duration = 4;
        else if (sec <= 8) normalized.duration = 8;
        else normalized.duration = 12;
      }
      if (audio) normalized.generate_audio = true;
      break;
    }

    case "wan": {
      if (resolution) normalized.resolution = resolution;
      // Wan 2.6 uses "5", "10", "15" for duration
      if (durationStr) normalized.duration = durationStr;
      break;
    }

    case "runway": {
      // Runway uses flat body with camelCase params
      if (aspectRatio) normalized.aspectRatio = aspectRatio;
      if (resolution) normalized.quality = resolution;
      // Runway duration is numeric 5 or 10
      if (durationStr) normalized.duration = Number(durationStr);
      break;
    }

    case "minimax": {
      // Hailuo 02 standard uses prompt + duration
      if (durationStr) normalized.duration = durationStr;
      break;
    }

    case "kling3_motion": {
      // Kling Motion Control: mode accepts "720p" or "1080p" directly
      normalized.mode = resolution === "1080p" ? "1080p" : "720p";
      break;
    }

    case "infinitalk": {
      if (resolution) normalized.resolution = resolution;
      break;
    }

    default: {
      // Fallback — pass through common params
      if (aspectRatio) normalized.aspect_ratio = aspectRatio;
      if (resolution) normalized.resolution = resolution;
      if (durationStr) normalized.duration = durationStr;
      break;
    }
  }

  return normalized;
}

function buildMediaInput(
  key: NonNullable<KieModelConfig["mediaInputKey"]>,
  mediaUrl: string | string[]
) {
  const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];

  if (key === "image_url" || key === "video_url") {
    return { [key]: mediaUrls[0] };
  }

  return { [key]: mediaUrls };
}

function extractTaskId(data?: KieCreateTaskData) {
  return data?.taskId ?? data?.id ?? null;
}

function extractResultUrls(data?: KieTaskStatusData) {
  const directUrls =
    data?.response?.resultUrls ??
    data?.response?.result_urls ??
    [];

  if (directUrls.length > 0) {
    return directUrls.filter((value): value is string => typeof value === "string");
  }

  if (!data?.resultJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(data.resultJson) as {
      resultUrls?: unknown;
      result_urls?: unknown;
      videos?: Array<{ url?: string }>;
      images?: Array<{ url?: string }>;
    };

    const resultUrls = Array.isArray(parsed.resultUrls)
      ? parsed.resultUrls
      : Array.isArray(parsed.result_urls)
        ? parsed.result_urls
        : [];

    if (resultUrls.length > 0) {
      return resultUrls.filter((value): value is string => typeof value === "string");
    }

    const mediaItems = [...(parsed.images ?? []), ...(parsed.videos ?? [])];
    return mediaItems
      .map((item) => item.url)
      .filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

async function maybeRefundOnError(
  refund: KieRefundContext | undefined,
  reason: string
) {
  if (!refund) {
    return;
  }

  try {
    await refundKieGenerationCredits(refund, reason);
  } catch (refundError) {
    console.error("[Kie.ai] Failed to auto-refund credits:", refundError);
  }
}

async function requestKie<T>(
  path: string,
  init: RequestInit,
  refund?: KieRefundContext
) {
  let response: Response;

  try {
    response = await fetch(`${KIE_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Kie.ai request failed";
    await maybeRefundOnError(refund, reason);
    throw new KieApiError(reason, { details: error });
  }

  let data: KieApiResponse<T> | null = null;

  try {
    data = (await response.json()) as KieApiResponse<T>;
  } catch {
    if (!response.ok) {
      const reason = `Kie.ai HTTP error ${response.status}`;
      await maybeRefundOnError(refund, reason);
      throw new KieApiError(reason, { statusCode: response.status });
    }
  }

  if (!response.ok) {
    const reason = data?.msg ?? data?.message ?? `Kie.ai HTTP error ${response.status}`;
    await maybeRefundOnError(refund, reason);
    throw new KieApiError(reason, {
      statusCode: response.status,
      details: data,
    });
  }

  if (!data || typeof data.code !== "number") {
    return data as KieApiResponse<T>;
  }

  if (data.code !== 200) {
    const reason = data.msg ?? data.message ?? "Kie.ai returned an unknown error";
    await maybeRefundOnError(refund, reason);
    throw new KieApiError(reason, { details: data });
  }

  return data;
}

async function createTask(
  modelId: string,
  options: KieTaskOptions,
  input: Record<string, unknown>
): Promise<KieCreateTaskResult> {
  const config = getModelConfig(modelId);
  const endpointPath = config.endpoint ?? KIE_CREATE_TASK_PATH;

  const mergedInput = {
    ...(config.defaults ?? {}),
    ...input,
    ...(options.input ?? {}),
  };

  let payload: Record<string, unknown>;

  if (config.flatBody) {
    // Flat body: all params at the top level (GPT Image, Flux Kontext, Veo, Runway)
    payload = {
      model: config.kieModel,
      ...mergedInput,
    };
    if (options.callBackUrl) {
      payload.callBackUrl = options.callBackUrl;
    }
  } else {
    // Standard envelope: { model, callBackUrl, input }
    payload = {
      model: config.kieModel,
      input: mergedInput,
    } satisfies KieRequestEnvelope;
    if (options.callBackUrl) {
      (payload as KieRequestEnvelope).callBackUrl = options.callBackUrl;
    }
  }

  logDebug("[Kie.ai] createTask", { modelId, endpointPath, payload });

  const data = await requestKie<KieCreateTaskData>(
    endpointPath,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    options.refund
  );

  const taskId = extractTaskId(data.data);
  if (!taskId) {
    const reason = `Kie.ai createTask response did not include a task id for model ${modelId}`;
    await maybeRefundOnError(options.refund, reason);
    throw new KieApiError(reason, { details: data });
  }

  return {
    taskId,
    type: config.taskType,
    model: modelId,
    kieModel: config.kieModel,
    raw: data,
  };
}

export async function generateImage(
  model: string,
  prompt: string,
  options: KieTaskOptions = {}
) {
  const config = getModelConfig(model);

  if (config.taskType !== "image" || config.taskMode !== "text-to-image") {
    throw new KieApiError(`Model ${model} does not support text-to-image generation.`);
  }

  return createTask(
    model,
    {
      ...options,
      input: normalizeImageInputOptions(model, options.input),
    },
    prompt.trim() ? { prompt } : {}
  );
}

export async function generateImageFromImage(
  model: string,
  prompt: string,
  imageUrl: string | string[],
  options: KieTaskOptions = {}
) {
  const config = getModelConfig(model);

  if (config.taskType !== "image" || config.taskMode !== "image-to-image") {
    throw new KieApiError(`Model ${model} does not support image-to-image generation.`);
  }

  return createTask(
    model,
    {
      ...options,
      input: normalizeImageInputOptions(model, options.input),
    },
    {
      ...(prompt.trim() ? { prompt } : {}),
      ...buildMediaInput(config.mediaInputKey ?? "image_urls", imageUrl),
    }
  );
}

export async function generateVideo(
  model: string,
  prompt: string,
  options: KieTaskOptions = {}
) {
  const config = getModelConfig(model);

  if (config.taskType !== "video" || config.taskMode !== "text-to-video") {
    throw new KieApiError(`Model ${model} does not support text-to-video generation.`);
  }

  return createTask(
    model,
    {
      ...options,
      input: normalizeVideoInputOptions(model, options.input),
    },
    prompt.trim() ? { prompt } : {}
  );
}

export async function generateVideoFromImage(
  model: string,
  prompt: string,
  imageUrl: string,
  options: KieTaskOptions = {}
) {
  const config = getModelConfig(model);

  if (
    config.taskType !== "video" ||
    (config.taskMode !== "image-to-video" && config.taskMode !== "video-to-video")
  ) {
    throw new KieApiError(
      `Model ${model} does not support source-based video generation.`
    );
  }

  return createTask(
    model,
    {
      ...options,
      input: normalizeVideoInputOptions(model, options.input),
    },
    {
      ...(prompt.trim() ? { prompt } : {}),
      ...buildMediaInput(config.mediaInputKey ?? "image_urls", imageUrl),
    }
  );
}

function resolveStatusState(raw: KieTaskStatusData): { state: string; success: boolean; failed: boolean } {
  // Flux / Veo uses `successFlag` (0=generating, 1=success, 2=create failed, 3=generate failed)
  if (typeof raw.successFlag === "number") {
    return {
      state: raw.successFlag === 1 ? "success" : raw.successFlag >= 2 ? "failed" : "generating",
      success: raw.successFlag === 1,
      failed: raw.successFlag >= 2,
    };
  }

  // Standard models and Runway use `state`
  if (raw.state) {
    const normalized = raw.state.toLowerCase();
    return {
      state: raw.state,
      success: normalized === "success" || normalized === "succeeded",
      failed: normalized === "failed" || normalized === "fail" || normalized === "error",
    };
  }

  // GPT Image uses `status` field (GENERATING, SUCCESS, CREATE_TASK_FAILED, GENERATE_FAILED)
  if (raw.status) {
    const normalized = raw.status.toLowerCase();
    return {
      state: raw.status,
      success: normalized === "success",
      failed: normalized === "create_task_failed" || normalized === "generate_failed",
    };
  }

  return { state: "UNKNOWN", success: false, failed: false };
}

function extractDedicatedResultUrls(raw: KieTaskStatusData): string[] {
  // Standard response format
  const standard = extractResultUrls(raw);
  if (standard.length > 0) return standard;

  // Runway uses videoInfo.videoUrl
  if (typeof raw.videoInfo?.videoUrl === "string") {
    return [raw.videoInfo.videoUrl];
  }

  // Flux uses response.resultImageUrl
  if (typeof raw.response?.resultImageUrl === "string") {
    return [raw.response.resultImageUrl];
  }

  return [];
}

export async function getTaskStatus(taskId: string, type: KieTaskType, modelId?: string) {
  const config: KieModelConfig | undefined = modelId ? KIE_MODELS[modelId as KieModelId] : undefined;
  const statusPath = config?.statusEndpoint
    ? `${config.statusEndpoint}?taskId=${encodeURIComponent(taskId)}`
    : `${KIE_TASK_STATUS_PATH}?taskId=${encodeURIComponent(taskId)}`;

  const data = await requestKie<KieTaskStatusData>(
    statusPath,
    { method: "GET" }
  );

  const raw = data.data ?? {};
  const resolved = resolveStatusState(raw);

  return {
    taskId,
    type,
    state: resolved.state,
    success: resolved.success,
    resultUrls: extractDedicatedResultUrls(raw),
    errorMessage: raw.failMsg ?? raw.errorMessage ?? undefined,
    raw,
  } satisfies KieTaskStatusResult;
}

export const kieModels = KIE_MODELS;
