import { ApiError } from "@/lib/api-error";
import { logDebug } from "@/lib/logger";
import { KieApiError } from "@/lib/kie/client";

const KIE_API_BASE_URL = "https://api.kie.ai";
const KIE_FILE_UPLOAD_BASE_URL = "https://kieai.redpandaai.co";
const KIE_V1_BASE_URL = `${KIE_API_BASE_URL}/api/v1`;
const KIE_CREATE_TASK_PATH = "/jobs/createTask";
const KIE_TASK_STATUS_PATH = "/jobs/recordInfo";
const KIE_FILE_UPLOAD_PATH = "/api/file-stream-upload";
const VOICES_SOURCE_URL = "https://kie.ai/elevenlabs-tts";

const FALLBACK_VOICES = [
  { id: "Rachel", name: "რეიჩელი", description: "სერიოზული, თავდაჯერებული" },
  { id: "Aria", name: "არია", description: "სუფთა, ნათელი" },
  { id: "Roger", name: "როჯერი", description: "ღრმა, მტკიცე" },
  { id: "Sarah", name: "სარა", description: "თბილი, ბუნებრივი" },
  { id: "Laura", name: "ლაურა", description: "რბილი, მშვიდი" },
  { id: "Charlie", name: "ჩარლი", description: "მეგობრული, ცოცხალი" },
  { id: "George", name: "ჯორჯი", description: "დაბალი, სტაბილური" },
  { id: "Callum", name: "კალუმი", description: "მკაფიო, ნეიტრალური" },
  { id: "River", name: "რივერი", description: "ჰაეროვანი, თანამედროვე" },
  { id: "Liam", name: "ლიამი", description: "დინამიკური, თბილი" },
  { id: "Charlotte", name: "შარლოტა", description: "ელეგანტური, რბილი" },
  { id: "Alice", name: "ალისა", description: "მეგობრული, მსუბუქი" },
  { id: "Matilda", name: "მატილდა", description: "თბილი, მკაფიო" },
  { id: "Will", name: "უილი", description: "მშვიდი, ბუნებრივი" },
  { id: "Jessica", name: "ჯესიკა", description: "ნაზი, სასაუბრო" },
  { id: "Eric", name: "ერიკი", description: "მტკიცე, პირდაპირი" },
  { id: "Chris", name: "კრისი", description: "ენერგიული, ხალისიანი" },
  { id: "Brian", name: "ბრაიანი", description: "ღრმა, მკვეთრი" },
  { id: "Daniel", name: "დანიელი", description: "გაწონასწორებული, პროფესიონალური" },
  { id: "Lily", name: "ლილი", description: "მსუბუქი, თბილი" },
  { id: "Bill", name: "ბილი", description: "ხავერდოვანი, დაბალი" },
] as const;

type KieResponse<T> = {
  code?: number;
  msg?: string;
  message?: string;
  data?: T;
};

type KieCreateTaskData = {
  taskId?: string;
  recordId?: string;
  id?: string;
};

type KieStatusData = {
  taskId?: string;
  state?: string;
  failMsg?: string;
  errorMessage?: string;
  response?: {
    resultUrls?: string[];
    result_urls?: string[];
  };
  resultJson?: string;
};

type UploadedFileData = {
  downloadUrl?: string;
  fileName?: string;
  filePath?: string;
  mimeType?: string;
};

export type AudioVoice = {
  id: string;
  name: string;
  description: string;
  label: string;
};

export type AudioTaskResult =
  | {
      kind: "audio";
      taskId: string;
      url: string;
      raw: KieStatusData;
    }
  | {
      kind: "transcription";
      taskId: string;
      text: string;
      segments: Array<{ speaker: string | null; text: string }>;
      raw: KieStatusData;
    };

type CreateAudioTaskInput = {
  model: string;
  input: Record<string, unknown>;
};

let cachedVoices:
  | {
      expiresAt: number;
      voices: AudioVoice[];
    }
  | null = null;

function getApiKey() {
  const apiKey = process.env.KIE_AI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "Kie.ai API გასაღები არ არის კონფიგურირებული");
  }

  return apiKey;
}

async function requestKieJson<T>(
  path: string,
  init: RequestInit
): Promise<KieResponse<T>> {
  const response = await fetch(`${KIE_V1_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const rawText = await response.text();
  let data: KieResponse<T>;

  try {
    data = rawText ? (JSON.parse(rawText) as KieResponse<T>) : {};
  } catch {
    throw new KieApiError("Kie.ai არასწორ პასუხს აბრუნებს", {
      statusCode: response.status,
      details: rawText,
    });
  }

  if (!response.ok || data.code !== 200) {
    throw new KieApiError(data.msg ?? data.message ?? "Kie.ai მოთხოვნა ვერ შესრულდა", {
      statusCode: response.status,
      details: data,
    });
  }

  return data;
}

function buildVoiceLabel(voice: Omit<AudioVoice, "label">) {
  return `${voice.name} - ${voice.description}`;
}

function normalizeVoiceName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getVoiceDescription(voiceId: string) {
  const fallback = FALLBACK_VOICES.find((item) => item.id === voiceId);
  if (fallback) {
    return fallback.description;
  }

  if (/^[A-Za-z]{3,}$/.test(voiceId)) {
    return "უნივერსალური ხმა";
  }

  return "პერსონალური ხმა";
}

function parseVoicesFromHtml(html: string): AudioVoice[] {
  const match = html.match(/voice:string \(([^)]+)\)/);
  const rawList = match?.[1];

  if (!rawList) {
    return FALLBACK_VOICES.map((item) => ({
      ...item,
      label: buildVoiceLabel(item),
    }));
  }

  const voices = rawList
    .split(" | ")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((voiceId) => {
      const fallback = FALLBACK_VOICES.find((item) => item.id === voiceId);
      const name = fallback?.name ?? normalizeVoiceName(voiceId);
      const description = getVoiceDescription(voiceId);
      return {
        id: voiceId,
        name,
        description,
        label: `${name} - ${description}`,
      };
    });

  return Array.from(new Map(voices.map((voice) => [voice.id, voice])).values());
}

export async function fetchVoices(): Promise<AudioVoice[]> {
  if (cachedVoices && cachedVoices.expiresAt > Date.now()) {
    return cachedVoices.voices;
  }

  try {
    const response = await fetch(VOICES_SOURCE_URL, {
      headers: {
        "User-Agent": "geo-ai-academy-audio-voices",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Voice source request failed: ${response.status}`);
    }

    const html = await response.text();
    const voices = parseVoicesFromHtml(html);

    cachedVoices = {
      expiresAt: Date.now() + 60 * 60 * 1000,
      voices,
    };

    return voices;
  } catch (error) {
    console.error("[Kie Audio] Failed to fetch voices, using fallback list:", error);
    const voices = FALLBACK_VOICES.map((item) => ({
      ...item,
      label: buildVoiceLabel(item),
    }));

    cachedVoices = {
      expiresAt: Date.now() + 10 * 60 * 1000,
      voices,
    };

    return voices;
  }
}

export async function uploadAudioFileToKie(params: {
  fileBuffer: ArrayBuffer;
  fileName: string;
  mimeType: string;
  uploadPath: string;
}) {
  const formData = new FormData();
  formData.set(
    "file",
    new Blob([params.fileBuffer], {
      type: params.mimeType || "application/octet-stream",
    }),
    params.fileName
  );
  formData.set("uploadPath", params.uploadPath);
  formData.set("fileName", params.fileName);

  const response = await fetch(`${KIE_FILE_UPLOAD_BASE_URL}${KIE_FILE_UPLOAD_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: formData,
  });

  const data = (await response.json()) as KieResponse<UploadedFileData> & {
    success?: boolean;
  };

  if (!response.ok || data.code !== 200 || !data.data?.downloadUrl) {
    throw new KieApiError(data.msg ?? data.message ?? "ფაილის ატვირთვა ვერ შესრულდა", {
      statusCode: response.status,
      details: data,
    });
  }

  return data.data.downloadUrl;
}

export async function createAudioTask({
  model,
  input,
}: CreateAudioTaskInput) {
  logDebug("[Kie Audio] createTask", { model, input });

  const response = await requestKieJson<KieCreateTaskData>(KIE_CREATE_TASK_PATH, {
    method: "POST",
    body: JSON.stringify({
      model,
      input,
    }),
  });

  const taskId =
    response.data?.taskId ??
    response.data?.recordId ??
    response.data?.id ??
    null;

  if (!taskId) {
    throw new KieApiError("Kie.ai task id ვერ დაბრუნდა", {
      details: response,
    });
  }

  return taskId;
}

async function getTaskDetails(taskId: string) {
  const response = await requestKieJson<KieStatusData>(
    `${KIE_TASK_STATUS_PATH}?taskId=${encodeURIComponent(taskId)}`,
    {
      method: "GET",
    }
  );

  return response.data ?? {};
}

function extractAudioUrl(data: KieStatusData) {
  const directUrls = [
    ...(data.response?.resultUrls ?? []),
    ...(data.response?.result_urls ?? []),
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  if (directUrls.length > 0) {
    return directUrls[0] ?? null;
  }

  if (!data.resultJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(data.resultJson) as {
      resultUrls?: string[];
      result_urls?: string[];
      url?: string;
      audio_url?: string;
      audio?: { url?: string };
      output?: string | string[];
    };

    const resultUrls = parsed.resultUrls ?? parsed.result_urls ?? [];
    if (Array.isArray(resultUrls) && resultUrls[0]) {
      return resultUrls[0];
    }

    if (typeof parsed.url === "string") return parsed.url;
    if (typeof parsed.audio_url === "string") return parsed.audio_url;
    if (typeof parsed.audio?.url === "string") return parsed.audio.url;
    if (typeof parsed.output === "string") return parsed.output;
    if (Array.isArray(parsed.output) && parsed.output[0]) return parsed.output[0];

    return null;
  } catch {
    return null;
  }
}

function normalizeSpeaker(value: unknown) {
  if (typeof value === "number") {
    return `Speaker ${value}`;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
}

function extractTranscription(data: KieStatusData) {
  const rawJson = data.resultJson;

  if (!rawJson) {
    throw new KieApiError("ტრანსკრიფციის შედეგი ვერ მოიძებნა");
  }

  const parsed = JSON.parse(rawJson) as {
    text?: string;
    transcript?: string;
    full_text?: string;
    segments?: Array<{
      text?: string;
      speaker?: string | number | null;
      speaker_id?: string | number | null;
    }>;
    speakers?: Array<{
      text?: string;
      speaker?: string | number | null;
    }>;
    words?: Array<{
      text?: string;
      word?: string;
      speaker?: string | number | null;
      speaker_id?: string | number | null;
    }>;
  };

  const segments =
    parsed.segments
      ?.map((segment) => ({
        speaker: normalizeSpeaker(segment.speaker ?? segment.speaker_id),
        text: (segment.text ?? "").trim(),
      }))
      .filter((segment) => segment.text.length > 0) ?? [];

  const speakerEntries =
    parsed.speakers
      ?.map((segment) => ({
        speaker: normalizeSpeaker(segment.speaker),
        text: (segment.text ?? "").trim(),
      }))
      .filter((segment) => segment.text.length > 0) ?? [];

  const groupedWords = (() => {
    if (!parsed.words?.length) {
      return [];
    }

    const items: Array<{ speaker: string | null; text: string }> = [];

    for (const word of parsed.words) {
      const speaker = normalizeSpeaker(word.speaker ?? word.speaker_id);
      const nextWord = (word.word ?? word.text ?? "").trim();

      if (!nextWord) {
        continue;
      }

      const lastItem = items[items.length - 1];
      if (lastItem && lastItem.speaker === speaker) {
        lastItem.text = `${lastItem.text} ${nextWord}`.trim();
      } else {
        items.push({ speaker, text: nextWord });
      }
    }

    return items;
  })();

  const normalizedSegments = segments.length > 0
    ? segments
    : speakerEntries.length > 0
      ? speakerEntries
      : groupedWords;

  const text =
    parsed.text?.trim() ??
    parsed.transcript?.trim() ??
    parsed.full_text?.trim() ??
    normalizedSegments.map((segment) => segment.text).join("\n").trim();

  if (!text) {
    throw new KieApiError("ტრანსკრიფციის ტექსტი ვერ დამუშავდა", {
      details: parsed,
    });
  }

  return {
    text,
    segments: normalizedSegments,
  };
}

export async function waitForAudioTaskResult(
  taskId: string,
  tool: "tts" | "dialogue" | "sfx" | "isolation" | "transcription",
  options?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  }
): Promise<AudioTaskResult> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const pollIntervalMs = options?.pollIntervalMs ?? 2_500;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const details = await getTaskDetails(taskId);
    const state = details.state?.toLowerCase() ?? "";

    if (state === "success" || state === "succeeded") {
      if (tool === "transcription") {
        const transcription = extractTranscription(details);
        return {
          kind: "transcription",
          taskId,
          text: transcription.text,
          segments: transcription.segments,
          raw: details,
        };
      }

      const url = extractAudioUrl(details);
      if (!url) {
        throw new KieApiError("აუდიოს შედეგის მისამართი ვერ მოიძებნა", {
          details,
        });
      }

      return {
        kind: "audio",
        taskId,
        url,
        raw: details,
      };
    }

    if (state === "fail" || state === "failed" || state === "error") {
      throw new KieApiError(
        details.failMsg ?? details.errorMessage ?? "აუდიო გენერაცია ვერ შესრულდა",
        { details }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new KieApiError("Kie.ai პასუხის ლოდინის დრო ამოიწურა");
}
