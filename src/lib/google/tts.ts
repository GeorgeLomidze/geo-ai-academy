import { ApiError } from "@/lib/api-error";

const GOOGLE_TTS_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export const GEMINI_TTS_MODEL_OPTIONS = [
  {
    id: "audio_tts_flash",
    model: "gemini-2.5-flash-preview-tts",
    label: "Gemini 2.5 Flash TTS",
  },
  {
    id: "audio_tts_pro",
    model: "gemini-2.5-pro-preview-tts",
    label: "Gemini 2.5 Pro TTS",
  },
] as const;

export const GEMINI_DIALOGUE_MODEL_OPTIONS = [
  {
    id: "audio_dialogue_flash",
    model: "gemini-2.5-flash-preview-tts",
    label: "Gemini 2.5 Flash TTS",
  },
  {
    id: "audio_dialogue_pro",
    model: "gemini-2.5-pro-preview-tts",
    label: "Gemini 2.5 Pro TTS",
  },
] as const;

export const GEMINI_TTS_VOICES = [
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Gacrux",
  "Pulcherrima",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
] as const;

export type GeminiTtsVoice = (typeof GEMINI_TTS_VOICES)[number];
export type GeminiSingleSpeakerModelId = (typeof GEMINI_TTS_MODEL_OPTIONS)[number]["id"];
export type GeminiDialogueModelId = (typeof GEMINI_DIALOGUE_MODEL_OPTIONS)[number]["id"];

export type GeminiVoiceOption = {
  id: GeminiTtsVoice;
  name: GeminiTtsVoice;
  description: string;
  label: string;
};

export type DialogueSegmentInput = {
  speaker: string;
  text: string;
  voice: GeminiTtsVoice;
};

type GoogleInlineAudioPart = {
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
};

type GoogleGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: GoogleInlineAudioPart[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export class GoogleTtsError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, options?: { statusCode?: number; details?: unknown }) {
    super(message);
    this.name = "GoogleTtsError";
    this.statusCode = options?.statusCode ?? 500;
    this.details = options?.details;
  }
}

const GEMINI_VOICE_DESCRIPTIONS: Record<GeminiTtsVoice, string> = {
  Zephyr: "მკაფიო და ნათელი",
  Puck: "მსუბუქი და ცოცხალი",
  Charon: "ღრმა და მკაცრი",
  Kore: "თბილი და ბუნებრივი",
  Fenrir: "მტკიცე და დაბალი",
  Leda: "რბილი და მშვიდი",
  Orus: "დინამიკური და გამოკვეთილი",
  Aoede: "მსუბუქი და ჰაეროვანი",
  Callirrhoe: "სუფთა და გაწონასწორებული",
  Autonoe: "ნაზი და რბილი",
  Enceladus: "სტაბილური და ზომიერი",
  Iapetus: "დაბალი და დარბაისლური",
  Umbriel: "მშვიდი და ღრმა",
  Algieba: "ელეგანტური და ნათელი",
  Despina: "სასიამოვნო და თბილი",
  Erinome: "მეგობრული და რბილი",
  Gacrux: "ენერგიული და გამოკვეთილი",
  Pulcherrima: "გლუვი და დახვეწილი",
  Vindemiatrix: "სუფთა და პროფესიონალური",
  Sadachbia: "კომფორტული და რბილი",
  Sadaltager: "მტკიცე და მკაფიო",
  Sulafat: "ელეგანტური და თბილი",
};

export const GEMINI_VOICE_OPTIONS: GeminiVoiceOption[] = GEMINI_TTS_VOICES.map(
  (voice) => ({
    id: voice,
    name: voice,
    description: GEMINI_VOICE_DESCRIPTIONS[voice],
    label: `${voice} - ${GEMINI_VOICE_DESCRIPTIONS[voice]}`,
  })
);

function getApiKey() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "Google AI API გასაღები არ არის კონფიგურირებული");
  }

  return apiKey;
}

function getModelName(modelId: GeminiSingleSpeakerModelId | GeminiDialogueModelId) {
  const option = [...GEMINI_TTS_MODEL_OPTIONS, ...GEMINI_DIALOGUE_MODEL_OPTIONS].find(
    (item) => item.id === modelId
  );

  if (!option) {
    throw new GoogleTtsError("Google TTS მოდელი ვერ მოიძებნა", {
      statusCode: 400,
    });
  }

  return option.model;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGoogleTts(
  modelId: GeminiSingleSpeakerModelId | GeminiDialogueModelId,
  body: Record<string, unknown>,
  attempt = 0
) {
  const model = getModelName(modelId);
  const requestUrl = `${GOOGLE_TTS_API_BASE_URL}/${model}:generateContent?key=${getApiKey()}`;

  console.log(
    "[Google TTS] Request",
    JSON.stringify(
      {
        envHasGoogleAiApiKey: Boolean(process.env.GOOGLE_AI_API_KEY),
        modelId,
        model,
        attempt,
        requestBody: body,
      },
      null,
      2
    )
  );

  const response = await fetch(
    requestUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const rawText = await response.text();
  let data: GoogleGenerateContentResponse;

  try {
    data = rawText ? (JSON.parse(rawText) as GoogleGenerateContentResponse) : {};
  } catch {
    console.error(
      "[Google TTS] Non-JSON response",
      JSON.stringify(
        {
          modelId,
          model,
          attempt,
          status: response.status,
          rawText,
        },
        null,
        2
      )
    );
    throw new GoogleTtsError("Google TTS არასწორ პასუხს აბრუნებს", {
      statusCode: response.status,
      details: rawText,
    });
  }

  if (!response.ok || data.error) {
    console.error(
      "[Google TTS] Error response",
      JSON.stringify(
        {
          modelId,
          model,
          attempt,
          status: response.status,
          responseText: rawText,
        },
        null,
        2
      )
    );

    const message =
      data.error?.message ??
      `Google TTS მოთხოვნა ვერ შესრულდა (${response.status})`;
    const statusCode = data.error?.code ?? response.status;
    const status = data.error?.status ?? "";
    const isRetryable = status === "INTERNAL" || statusCode >= 500;

    if (isRetryable && attempt < 2) {
      await sleep(350 * (attempt + 1));
      return requestGoogleTts(modelId, body, attempt + 1);
    }

    throw new GoogleTtsError(message, {
      statusCode,
      details: data.error ?? data,
    });
  }

  console.log(
    "[Google TTS] Success response",
    JSON.stringify(
      {
        modelId,
        model,
        attempt,
        status: response.status,
        mimeType:
          data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.mimeType)
            ?.inlineData?.mimeType ?? null,
        hasInlineAudioData: Boolean(
          data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)
            ?.inlineData?.data
        ),
      },
      null,
      2
    )
  );

  return data;
}

function buildSingleSpeakerPrompt(text: string, styleInstructions: string) {
  return [
    "Generate spoken audio for the text only.",
    "Do not read the instructions aloud.",
    styleInstructions.trim()
      ? `Style instructions: ${styleInstructions.trim()}`
      : null,
    "Text:",
    text.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildDialoguePrompt(
  segments: DialogueSegmentInput[],
  styleInstructions: string
) {
  const speakerList = Array.from(
    new Set(segments.map((segment) => segment.speaker.trim()))
  );

  return [
    "Generate spoken dialogue for the script below.",
    "Do not read the instructions aloud.",
    styleInstructions.trim()
      ? `Style instructions: ${styleInstructions.trim()}`
      : null,
    `Speakers: ${speakerList.join(", ")}`,
    "Script:",
    ...segments.map(
      (segment) => `${segment.speaker.trim()}: ${segment.text.trim()}`
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function parseSampleRate(mimeType: string | undefined) {
  const match = mimeType?.match(/rate=(\d+)/i);
  return match ? Number.parseInt(match[1] ?? "24000", 10) : 24000;
}

function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate: number) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const wavBuffer = Buffer.alloc(44 + dataSize);

  wavBuffer.write("RIFF", 0);
  wavBuffer.writeUInt32LE(36 + dataSize, 4);
  wavBuffer.write("WAVE", 8);
  wavBuffer.write("fmt ", 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20);
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);
  wavBuffer.write("data", 36);
  wavBuffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wavBuffer, 44);

  return wavBuffer;
}

function getAudioPart(response: GoogleGenerateContentResponse) {
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return part.inlineData;
      }
    }
  }

  throw new GoogleTtsError("Google TTS აუდიოს არ აბრუნებს", {
    details: response,
  });
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

function normalizeTemperature(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(2, Math.max(0, value));
}

export async function generateSpeech(
  text: string,
  styleInstructions: string,
  voice: GeminiTtsVoice,
  model: GeminiSingleSpeakerModelId,
  temperature: number
) {
  const response = await requestGoogleTts(model, {
    contents: [
      {
        parts: [
          {
            text: buildSingleSpeakerPrompt(text, styleInstructions),
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      temperature: normalizeTemperature(temperature),
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
    },
  });

  const inlineData = getAudioPart(response);
  const pcmBuffer = Buffer.from(inlineData.data ?? "", "base64");
  const sampleRate = parseSampleRate(inlineData.mimeType);
  const wavBuffer = pcmToWavBuffer(pcmBuffer, sampleRate);

  return {
    audioBuffer: toArrayBuffer(wavBuffer),
    mimeType: "audio/wav",
    extension: "wav",
  };
}

export async function generateDialogue(
  segments: DialogueSegmentInput[],
  styleInstructions: string,
  model: GeminiDialogueModelId,
  temperature: number
) {
  const uniqueSpeakers = Array.from(
    new Map(
      segments.map((segment) => [
        segment.speaker.trim(),
        {
          speaker: segment.speaker.trim(),
          voice: segment.voice,
        },
      ])
    ).values()
  );

  if (uniqueSpeakers.length > 2) {
    throw new GoogleTtsError("Gemini დიალოგი მაქსიმუმ ორ სპიკერს უჭერს მხარს", {
      statusCode: 400,
    });
  }

  const response = await requestGoogleTts(model, {
    contents: [
      {
        parts: [
          {
            text: buildDialoguePrompt(segments, styleInstructions),
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      temperature: normalizeTemperature(temperature),
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: uniqueSpeakers.map((item) => ({
            speaker: item.speaker,
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: item.voice,
              },
            },
          })),
        },
      },
    },
  });

  const inlineData = getAudioPart(response);
  const pcmBuffer = Buffer.from(inlineData.data ?? "", "base64");
  const sampleRate = parseSampleRate(inlineData.mimeType);
  const wavBuffer = pcmToWavBuffer(pcmBuffer, sampleRate);

  return {
    audioBuffer: toArrayBuffer(wavBuffer),
    mimeType: "audio/wav",
    extension: "wav",
  };
}
