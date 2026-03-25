export type ModelPricing = {
  name: string;
  coins: number;
  kieModel: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  qualityOptions?: string[];
  defaultQuality?: string;
  coinsByQuality?: Record<string, number>;
};

export type VideoModelConfig = {
  name: string;
  kieModel: string;
  type: "VIDEO";
  provider: string;
  providerMark: string;
  category: "GENERAL" | "TOOLS";
  inputMode: "text" | "image" | "video";
  waitTime: string;
  supportsMultiShot?: boolean;
  supportsAudio?: boolean;
  resolutions: string[];
  aspectRatios: string[];
  durations: string[];
  defaultResolution: string;
  defaultAspectRatio: string;
  defaultDuration: string;
  /** Coin cost per resolution. Key is resolution string (e.g. "720p"). */
  coinsByResolution: Record<string, number>;
  /** When set, cost = coinsPerSecond * duration. Overrides coinsByResolution. */
  coinsPerSecondByResolution?: Record<string, number>;
  /** Hide from the main model dropdown (used for variants that appear as sub-selectors). */
  hidden?: boolean;
  /** Sub-variants shown as a toggle on the sidebar panel. The parent model ID is always first. */
  variants?: { id: string; label: string }[];
  /** Supports one or two reference images as start/end keyframes. */
  supportsFirstLastFrames?: boolean;
};

export type AudioToolId =
  | "audio_tts_flash"
  | "audio_tts_pro"
  | "audio_dialogue_flash"
  | "audio_dialogue_pro"
  | "audio_tts"
  | "audio_dialogue"
  | "audio_sfx"
  | "audio_isolation"
  | "audio_transcription";

export type AudioModelConfig = {
  name: string;
  kieModel: string;
  type: "AUDIO";
  tool: "tts" | "dialogue" | "sfx" | "isolation" | "transcription";
  baseKieCredits: number;
  coins: number;
};

export const IMAGE_MODELS = {
  nanobanana: {
    name: "Nano Banana",
    coins: 6,
    kieModel: "google/nano-banana",
    type: "IMAGE",
  },
  nanobanana_edit: {
    name: "Nano Banana Edit",
    coins: 6,
    kieModel: "google/nano-banana-edit",
    type: "IMAGE",
  },
  nanobanana2: {
    name: "Nano Banana 2",
    coins: 12,
    kieModel: "nano-banana-2",
    type: "IMAGE",
    qualityOptions: ["1K", "2K", "4K"],
    defaultQuality: "4K",
    coinsByQuality: {
      "1K": 6,
      "2K": 9,
      "4K": 12,
    },
  },
  nanobanana2_edit: {
    name: "Nano Banana 2 Edit",
    coins: 12,
    kieModel: "nano-banana-2",
    type: "IMAGE",
    qualityOptions: ["1K", "2K", "4K"],
    defaultQuality: "4K",
    coinsByQuality: {
      "1K": 6,
      "2K": 9,
      "4K": 12,
    },
  },
  nanobananapro: {
    name: "Nano Banana Pro",
    coins: 36,
    kieModel: "nano-banana-pro",
    type: "IMAGE",
    qualityOptions: ["1K", "2K", "4K"],
    defaultQuality: "4K",
    coinsByQuality: {
      "1K": 18,
      "2K": 27,
      "4K": 36,
    },
  },
  nanobananapro_edit: {
    name: "Nano Banana Pro Edit",
    coins: 36,
    kieModel: "nano-banana-pro",
    type: "IMAGE",
    qualityOptions: ["1K", "2K", "4K"],
    defaultQuality: "4K",
    coinsByQuality: {
      "1K": 18,
      "2K": 27,
      "4K": 36,
    },
  },
  seedream5lite: {
    name: "Seedream 5 Lite",
    coins: 15,
    kieModel: "seedream/5-lite-text-to-image",
    type: "IMAGE",
    qualityOptions: ["2K", "4K"],
    defaultQuality: "4K",
    coinsByQuality: {
      "2K": 10,
      "4K": 15,
    },
  },
  seedream5lite_edit: {
    name: "Seedream 5 Lite Edit",
    coins: 15,
    kieModel: "seedream/5-lite-image-to-image",
    type: "IMAGE",
    qualityOptions: ["2K", "4K"],
    defaultQuality: "4K",
    coinsByQuality: {
      "2K": 10,
      "4K": 15,
    },
  },
  grok_t2i: {
    name: "Grok Imagine Image",
    coins: 9,
    kieModel: "grok-imagine/text-to-image",
    type: "IMAGE",
  },
  grok_i2i: {
    name: "Grok Imagine Edit",
    coins: 9,
    kieModel: "grok-imagine/image-to-image",
    type: "IMAGE",
  },
  openaiimage: {
    name: "OpenAI Image",
    coins: 12,
    kieModel: "gpt-4o-image",
    type: "IMAGE",
  },
  flux: {
    name: "Flux Kontext",
    coins: 15,
    kieModel: "flux-kontext-pro",
    type: "IMAGE",
  },
} as const satisfies Record<string, ModelPricing>;

export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  grok_t2v: {
    name: "Grok T2V",
    kieModel: "grok-imagine/text-to-video",
    type: "VIDEO",
    provider: "xAI",
    providerMark: "x",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~30 წამი",
    resolutions: ["480p", "720p"],
    aspectRatios: ["16:9", "9:16", "1:1", "2:3", "3:2"],
    durations: ["6s", "10s", "15s"],
    defaultResolution: "480p",
    defaultAspectRatio: "16:9",
    defaultDuration: "6s",
    coinsByResolution: { "480p": 20, "720p": 30 },
  },
  grok_i2v: {
    name: "Grok I2V",
    kieModel: "grok-imagine/image-to-video",
    type: "VIDEO",
    provider: "xAI",
    providerMark: "x",
    category: "GENERAL",
    inputMode: "image",
    waitTime: "~30 წამი",
    resolutions: ["480p", "720p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    durations: ["6s", "10s", "15s"],
    defaultResolution: "480p",
    defaultAspectRatio: "16:9",
    defaultDuration: "6s",
    coinsByResolution: { "480p": 20, "720p": 30 },
  },
  grok_upscale: {
    name: "Grok Upscale",
    kieModel: "grok-imagine/video-upscale",
    type: "VIDEO",
    provider: "xAI",
    providerMark: "x",
    category: "TOOLS",
    inputMode: "video",
    waitTime: "~30-45 წამი",
    resolutions: [],
    aspectRatios: [],
    durations: [],
    defaultResolution: "",
    defaultAspectRatio: "",
    defaultDuration: "",
    coinsByResolution: { "": 15 },
  },
  veo31: {
    name: "Veo 3.1",
    kieModel: "veo3",
    type: "VIDEO",
    provider: "Google",
    providerMark: "G",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~2-5 წუთი",
    resolutions: ["1080p", "4K"],
    aspectRatios: ["16:9", "9:16"],
    durations: ["4s", "6s", "8s"],
    defaultResolution: "1080p",
    defaultAspectRatio: "16:9",
    defaultDuration: "4s",
    coinsByResolution: { "1080p": 150, "4K": 390 },
    supportsFirstLastFrames: true,
    variants: [
      { id: "veo31", label: "3.1 Quality" },
      { id: "veo31fast", label: "3.1 Fast" },
    ],
  },
  veo31fast: {
    name: "Veo 3.1 Fast",
    kieModel: "veo3_fast",
    type: "VIDEO",
    provider: "Google",
    providerMark: "G",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~1-2 წუთი",
    resolutions: ["1080p", "4K"],
    aspectRatios: ["16:9", "9:16"],
    durations: ["4s", "6s", "8s"],
    defaultResolution: "1080p",
    defaultAspectRatio: "16:9",
    defaultDuration: "4s",
    coinsByResolution: { "1080p": 120, "4K": 360 },
    supportsFirstLastFrames: true,
    hidden: true,
  },
  sora2: {
    name: "Sora 2",
    kieModel: "sora-2-text-to-video",
    type: "VIDEO",
    provider: "OpenAI",
    providerMark: "O",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~2-4 წუთი",
    resolutions: ["720p"],
    aspectRatios: ["16:9", "9:16"],
    durations: ["5s", "10s"],
    defaultResolution: "720p",
    defaultAspectRatio: "16:9",
    defaultDuration: "5s",
    coinsByResolution: { "720p": 150 },
  },
  sora2pro: {
    name: "Sora 2 Pro",
    kieModel: "sora-2-pro-text-to-video",
    type: "VIDEO",
    provider: "OpenAI",
    providerMark: "O",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~3-5 წუთი",
    resolutions: ["1080p"],
    aspectRatios: ["16:9", "9:16"],
    durations: ["5s", "10s"],
    defaultResolution: "1080p",
    defaultAspectRatio: "16:9",
    defaultDuration: "10s",
    coinsByResolution: { "1080p": 450 },
  },
  kling3: {
    name: "Kling 3.0",
    kieModel: "kling-3.0/video",
    type: "VIDEO",
    provider: "Kling AI",
    providerMark: "K",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~3-5 წუთი",
    supportsMultiShot: true,
    supportsAudio: true,
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    durations: ["3s", "15s"],
    defaultResolution: "720p",
    defaultAspectRatio: "16:9",
    defaultDuration: "5s",
    coinsByResolution: { "720p": 90, "1080p": 180 },
    coinsPerSecondByResolution: { "720p": 18, "1080p": 36 },
    supportsFirstLastFrames: true,
  },
  seedance: {
    name: "Seedance 1.5 Pro",
    kieModel: "bytedance/seedance-1.5-pro",
    type: "VIDEO",
    provider: "ByteDance",
    providerMark: "B",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~1-2 წუთი",
    supportsAudio: true,
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    durations: ["4s", "8s", "12s"],
    defaultResolution: "720p",
    defaultAspectRatio: "16:9",
    defaultDuration: "8s",
    coinsByResolution: { "480p": 30, "720p": 60, "1080p": 120 },
  },
  wan: {
    name: "Wan 2.6",
    kieModel: "wan/2-6-text-to-video",
    type: "VIDEO",
    provider: "Alibaba",
    providerMark: "A",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~1-2 წუთი",
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    durations: ["5s", "10s", "15s"],
    defaultResolution: "720p",
    defaultAspectRatio: "16:9",
    defaultDuration: "5s",
    coinsByResolution: { "720p": 60, "1080p": 90 },
  },
  runway: {
    name: "Runway Gen 4",
    kieModel: "runway-gen4",
    type: "VIDEO",
    provider: "Runway",
    providerMark: "R",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~1-2 წუთი",
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    durations: ["5s", "10s"],
    defaultResolution: "720p",
    defaultAspectRatio: "16:9",
    defaultDuration: "5s",
    coinsByResolution: { "720p": 120, "1080p": 180 },
  },
  minimax: {
    name: "Hailuo 02",
    kieModel: "hailuo/02-text-to-video-standard",
    type: "VIDEO",
    provider: "MiniMax",
    providerMark: "M",
    category: "GENERAL",
    inputMode: "text",
    waitTime: "~1-2 წუთი",
    resolutions: ["720p"],
    aspectRatios: ["16:9"],
    durations: ["6s", "10s"],
    defaultResolution: "720p",
    defaultAspectRatio: "16:9",
    defaultDuration: "6s",
    coinsByResolution: { "720p": 60 },
  },
  topaz_upscale: {
    name: "Topaz Upscale",
    kieModel: "topaz/video-upscale",
    type: "VIDEO",
    provider: "Tools",
    providerMark: "T",
    category: "TOOLS",
    inputMode: "video",
    waitTime: "~30-60 წამი",
    resolutions: [],
    aspectRatios: [],
    durations: [],
    defaultResolution: "",
    defaultAspectRatio: "",
    defaultDuration: "",
    coinsByResolution: { "": 23 },
  },
  kling3_motion: {
    name: "Kling 3.0 Motion",
    kieModel: "kling-3.0/motion-control",
    type: "VIDEO",
    provider: "Kling AI",
    providerMark: "K",
    category: "TOOLS",
    inputMode: "image",
    waitTime: "~3-5 წუთი",
    resolutions: ["720p", "1080p"],
    aspectRatios: [],
    durations: [],
    defaultResolution: "720p",
    defaultAspectRatio: "",
    defaultDuration: "",
    coinsByResolution: { "720p": 120, "1080p": 240 },
  },
  infinitalk: {
    name: "Infinitalk",
    kieModel: "infinitalk/from-audio",
    type: "VIDEO",
    provider: "Tools",
    providerMark: "T",
    category: "TOOLS",
    inputMode: "image",
    waitTime: "~1-2 წუთი",
    resolutions: ["480p", "720p"],
    aspectRatios: ["9:16", "1:1"],
    durations: [],
    defaultResolution: "480p",
    defaultAspectRatio: "9:16",
    defaultDuration: "",
    coinsByResolution: { "480p": 30, "720p": 45 },
  },
};

export const AUDIO_MODELS: Record<AudioToolId, AudioModelConfig> = {
  audio_tts_flash: {
    name: "წაკითხვა Flash",
    kieModel: "gemini-2.5-flash-preview-tts",
    type: "AUDIO",
    tool: "tts",
    baseKieCredits: 2,
    coins: 3,
  },
  audio_tts_pro: {
    name: "წაკითხვა",
    kieModel: "gemini-2.5-pro-preview-tts",
    type: "AUDIO",
    tool: "tts",
    baseKieCredits: 4,
    coins: 6,
  },
  audio_dialogue_flash: {
    name: "დიალოგი Flash",
    kieModel: "gemini-2.5-flash-preview-tts",
    type: "AUDIO",
    tool: "dialogue",
    baseKieCredits: 3,
    coins: 4,
  },
  audio_dialogue_pro: {
    name: "დიალოგი",
    kieModel: "gemini-2.5-pro-preview-tts",
    type: "AUDIO",
    tool: "dialogue",
    baseKieCredits: 5,
    coins: 8,
  },
  audio_tts: {
    name: "წაკითხვა",
    kieModel: "elevenlabs/text-to-speech-multilingual-v2",
    type: "AUDIO",
    tool: "tts",
    baseKieCredits: 4,
    coins: 6,
  },
  audio_dialogue: {
    name: "დიალოგი",
    kieModel: "elevenlabs/text-to-dialogue-v3",
    type: "AUDIO",
    tool: "dialogue",
    baseKieCredits: 6,
    coins: 9,
  },
  audio_sfx: {
    name: "ხმოვანი ეფექტები",
    kieModel: "elevenlabs/sound-effect-v2",
    type: "AUDIO",
    tool: "sfx",
    baseKieCredits: 5,
    coins: 8,
  },
  audio_isolation: {
    name: "ხმის იზოლაცია",
    kieModel: "elevenlabs/audio-isolation",
    type: "AUDIO",
    tool: "isolation",
    baseKieCredits: 6,
    coins: 9,
  },
  audio_transcription: {
    name: "ტრანსკრიფცია",
    kieModel: "elevenlabs/speech-to-text",
    type: "AUDIO",
    tool: "transcription",
    baseKieCredits: 8,
    coins: 12,
  },
};

/** Helper to get coin cost for a video model at a given resolution and duration */
export function getVideoModelCoins(modelId: string, resolution?: string, durationSeconds?: number): number | null {
  const config = VIDEO_MODELS[modelId];
  if (!config) return null;

  const res = resolution ?? config.defaultResolution ?? "";

  // Per-second pricing when available
  if (config.coinsPerSecondByResolution && durationSeconds) {
    const perSecond = config.coinsPerSecondByResolution[res]
      ?? Object.values(config.coinsPerSecondByResolution)[0];
    if (perSecond != null) {
      return Math.round(perSecond * durationSeconds);
    }
  }

  return config.coinsByResolution[res] ?? Object.values(config.coinsByResolution)[0] ?? null;
}

export function getNormalizedVideoDuration(
  modelId: string,
  requested?: string | number | null
): string | null {
  const config = VIDEO_MODELS[modelId];

  if (!config) {
    if (typeof requested === "number") {
      return `${requested}s`;
    }

    return typeof requested === "string" ? requested : null;
  }

  if (modelId === "kling3") {
    const minSeconds = 3;
    const maxSeconds = 15;
    const defaultSeconds = Number.parseInt(config.defaultDuration, 10) || 5;
    const requestedSeconds =
      typeof requested === "number"
        ? requested
        : typeof requested === "string"
          ? Number.parseInt(requested, 10)
          : Number.NaN;

    if (Number.isNaN(requestedSeconds)) {
      return `${defaultSeconds}s`;
    }

    const clampedSeconds = Math.min(
      maxSeconds,
      Math.max(minSeconds, requestedSeconds)
    );
    return `${clampedSeconds}s`;
  }

  const allowedDurations = config.durations.filter(Boolean);
  const defaultDuration =
    allowedDurations.find((duration) => duration === config.defaultDuration) ??
    allowedDurations[0] ??
    config.defaultDuration;

  if (allowedDurations.length === 0) {
    if (typeof requested === "number") {
      return `${requested}s`;
    }

    return typeof requested === "string" ? requested : defaultDuration || null;
  }

  const requestedLabel =
    typeof requested === "number"
      ? `${requested}s`
      : typeof requested === "string"
        ? requested
        : null;

  if (requestedLabel && allowedDurations.includes(requestedLabel)) {
    return requestedLabel;
  }

  const requestedSeconds =
    typeof requested === "number"
      ? requested
      : typeof requested === "string"
        ? Number.parseInt(requested, 10)
        : Number.NaN;

  if (Number.isNaN(requestedSeconds)) {
    return defaultDuration || null;
  }

  let closestDuration = allowedDurations[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const duration of allowedDurations) {
    const seconds = Number.parseInt(duration, 10);
    if (Number.isNaN(seconds)) continue;

    const distance = Math.abs(seconds - requestedSeconds);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestDuration = duration;
    }
  }

  return closestDuration ?? defaultDuration ?? null;
}

/** Backward-compatible: flat model pricing for both image + video */
function buildVideoModelPricing(): Record<string, ModelPricing> {
  const result: Record<string, ModelPricing> = {};
  for (const [id, config] of Object.entries(VIDEO_MODELS)) {
    // Use the default resolution's cost as the base price
    const defaultCoins = getVideoModelCoins(id) ?? 0;
    result[id] = {
      name: config.name,
      coins: defaultCoins,
      kieModel: config.kieModel,
      type: "VIDEO",
    };
  }
  return result;
}

export const ALL_MODELS: Record<string, ModelPricing> = {
  ...IMAGE_MODELS,
  ...buildVideoModelPricing(),
  ...AUDIO_MODELS,
};

export type SupportedModelId =
  | keyof typeof IMAGE_MODELS
  | keyof typeof VIDEO_MODELS
  | keyof typeof AUDIO_MODELS;

export function getImageModelCoins(modelId: string, quality?: string): number | null {
  const config = (IMAGE_MODELS as Record<string, ModelPricing>)[modelId];
  if (!config) {
    return null;
  }

  if (!config.coinsByQuality) {
    return config.coins;
  }

  const resolvedQuality = quality ?? config.defaultQuality;
  return config.coinsByQuality[resolvedQuality ?? ""] ?? config.coins;
}

export function getModelPrice(modelId: string, resolution?: string, durationSeconds?: number): number | null {
  // For video models, use resolution + duration aware pricing
  if (modelId in VIDEO_MODELS) {
    return getVideoModelCoins(modelId, resolution, durationSeconds);
  }
  if (modelId in AUDIO_MODELS) {
    return AUDIO_MODELS[modelId as AudioToolId].coins;
  }
  return getImageModelCoins(modelId, resolution);
}

export function getModelMetadata(modelId: string): ModelPricing | null {
  return ALL_MODELS[modelId] ?? null;
}
