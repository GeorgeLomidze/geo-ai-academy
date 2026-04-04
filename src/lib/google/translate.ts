import { ApiError } from "@/lib/api-error";

const GOOGLE_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GOOGLE_TRANSLATE_MODEL = "gemini-2.5-flash";

const envFileCache = new Map<string, string>();

function getEnvFileValue(key: string) {
  if (typeof window !== "undefined") {
    return "";
  }

  if (envFileCache.has(key)) {
    return envFileCache.get(key) ?? "";
  }

  const envFiles = [".env.local", ".env"];

  for (const fileName of envFiles) {
    try {
      const runtimeRequire = Function("return require")() as NodeRequire;
      const { existsSync, readFileSync } = runtimeRequire("node:fs") as typeof import("node:fs");
      const { join } = runtimeRequire("node:path") as typeof import("node:path");
      const filePath = join(process.cwd(), fileName);

      if (!existsSync(filePath)) {
        continue;
      }

      const contents = readFileSync(filePath, "utf8");
      const match = contents.match(new RegExp(`^${key}=(.*)$`, "m"));
      const rawValue = match?.[1]?.trim();

      if (rawValue) {
        const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");
        envFileCache.set(key, normalizedValue);
        return normalizedValue;
      }
    } catch {
      // Ignore env parsing issues and fall back to process.env.
    }
  }

  envFileCache.set(key, "");
  return "";
}

function getApiKey() {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    getEnvFileValue("GOOGLE_AI_API_KEY") ||
    process.env.GEMINI_API_KEY?.trim() ||
    getEnvFileValue("GEMINI_API_KEY") ||
    process.env.GOOGLE_API_KEY?.trim() ||
    getEnvFileValue("GOOGLE_API_KEY");

  if (!apiKey) {
    throw new ApiError(500, "თარგმნის სერვისი არ არის კონფიგურირებული");
  }

  return apiKey;
}

function getOptionalApiKey() {
  try {
    return getApiKey();
  } catch {
    return "";
  }
}

function extractText(response: unknown) {
  if (
    !response ||
    typeof response !== "object" ||
    !("candidates" in response) ||
    !Array.isArray((response as { candidates?: unknown[] }).candidates)
  ) {
    return "";
  }

  const firstCandidate = (response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }).candidates?.[0];

  const text = firstCandidate?.content?.parts?.find((part) => typeof part.text === "string")?.text;
  return typeof text === "string" ? text.trim() : "";
}

export function isLikelyGeorgianText(text: string) {
  return /[\u10A0-\u10FF]/.test(text);
}

function fallbackTranslateSoundEffectPrompt(text: string) {
  const trimmed = text.trim();
  const normalized = trimmed.toLowerCase();

  const phraseReplacements: Array<[RegExp, string]> = [
    [/ბავშვის სიცილის ხმა/g, "sound of baby laughter"],
    [/ბავშვის სიცილი/g, "baby laughter"],
    [/სიცილის ხმა/g, "sound of laughter"],
    [/ბავშვის ტირილის ხმა/g, "sound of a baby crying"],
    [/ბავშვის ტირილი/g, "baby crying"],
    [/წვიმის ხმა/g, "sound of rain"],
    [/ზღვის ტალღების ხმა/g, "sound of ocean waves"],
    [/ზღვის ხმა/g, "sound of the ocean"],
    [/ქარის ხმა/g, "sound of wind"],
    [/ტაშის ხმა/g, "sound of applause"],
    [/ძაღლის ყეფის ხმა/g, "sound of a dog barking"],
    [/კატის კნავილის ხმა/g, "sound of a cat meowing"],
    [/მანქანის ძრავის ხმა/g, "sound of a car engine"],
    [/ფერარის ინტენსიური ხმა/g, "intense ferrari engine sound"],
  ];

  for (const [pattern, replacement] of phraseReplacements) {
    if (pattern.test(normalized)) {
      return replacement;
    }
  }

  const tokenMap: Record<string, string> = {
    ბავშვვის: "baby",
    ბავშვის: "baby",
    ბავშვი: "baby",
    სიცილი: "laughter",
    სიცილის: "laughter",
    ტირილი: "crying",
    ტირილის: "crying",
    ხმა: "sound",
    ხმის: "sound",
    წვიმა: "rain",
    წვიმის: "rain",
    ზღვა: "ocean",
    ზღვის: "ocean",
    ტალღები: "waves",
    ტალღების: "waves",
    ქარი: "wind",
    ქარის: "wind",
    ტაში: "applause",
    ტაშის: "applause",
    ძაღლი: "dog",
    ძაღლის: "dog",
    ყეფა: "barking",
    ყეფის: "barking",
    კატა: "cat",
    კატის: "cat",
    კნავილი: "meowing",
    კნავილის: "meowing",
    მანქანა: "car",
    მანქანის: "car",
    ძრავა: "engine",
    ძრავის: "engine",
    ფერარი: "ferrari",
    ინტენსიური: "intense",
  };

  const translatedTokens = normalized
    .split(/\s+/)
    .map((token) => token.replace(/[^\u10A0-\u10FFa-z0-9-]/gi, ""))
    .filter(Boolean)
    .map((token) => tokenMap[token] ?? token);

  const joined = translatedTokens.join(" ").trim();
  if (!joined || isLikelyGeorgianText(joined)) {
    return trimmed;
  }

  if (joined.startsWith("sound") || joined.startsWith("audio")) {
    return joined;
  }

  if (
    joined.includes("laughter") ||
    joined.includes("crying") ||
    joined.includes("rain") ||
    joined.includes("waves") ||
    joined.includes("wind") ||
    joined.includes("applause") ||
    joined.includes("barking") ||
    joined.includes("meowing") ||
    joined.includes("engine")
  ) {
    return `sound of ${joined}`;
  }

  return joined;
}

export async function translateSoundEffectPromptToEnglish(text: string) {
  const trimmed = text.trim();
  if (!trimmed || !isLikelyGeorgianText(trimmed)) {
    return trimmed;
  }

  const apiKey = getOptionalApiKey();
  if (!apiKey) {
    return fallbackTranslateSoundEffectPrompt(trimmed);
  }

  const url = `${GOOGLE_API_BASE_URL}/${GOOGLE_TRANSLATE_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Convert this Georgian request into a short English non-speech sound effect prompt. " +
                "Describe the sound itself, not words to be spoken. " +
                "Return English only, no quotes, no explanations.\n\n" +
                `Request: ${trimmed}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    return fallbackTranslateSoundEffectPrompt(trimmed);
  }

  const translated = extractText(payload)
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  return translated || fallbackTranslateSoundEffectPrompt(trimmed);
}
