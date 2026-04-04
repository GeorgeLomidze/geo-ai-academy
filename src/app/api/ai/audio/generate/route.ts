import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod/v4";
import {
  ApiError,
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import {
  BunnyStorageError,
  persistToBunnyStorage,
  uploadToStorage,
  warnBunnyUnauthorizedOnce,
} from "@/lib/bunny/storage";
import { deductCreditsWithClient, hasEnoughCredits } from "@/lib/credits/manager";
import { AUDIO_MODELS, type AudioToolId } from "@/lib/credits/pricing";
import { refundKieGenerationCredits } from "@/lib/kie/callback";
import {
  createAudioTask,
  uploadAudioFileToKie,
  waitForAudioTaskResult,
} from "@/lib/kie/audio";
import { KieApiError } from "@/lib/kie/client";
import { translateSoundEffectPromptToEnglish } from "@/lib/google/translate";
import { prisma } from "@/lib/prisma";

const jsonEnvelopeSchema = z.object({
  tool: z.enum(["sfx", "isolation", "transcription"]),
  params: z.record(z.string(), z.unknown()).default({}),
});

const soundEffectSchema = z.object({
  text: z.string().trim().min(1, "აღწერა აუცილებელია"),
  loop: z.boolean().default(false),
  duration_seconds: z.number().min(0.5).max(22).default(11.2),
  prompt_influence: z.number().min(0).max(1).default(0.3),
  output_format: z.string().trim().default("mp3_44100_128"),
});

function normalizeSoundEffectParams(params: z.infer<typeof soundEffectSchema>) {
  return {
    ...params,
    duration_seconds: Number((Math.round(params.duration_seconds * 10) / 10).toFixed(1)),
  };
}

const transcriptionSchema = z.object({
  language_code: z.string().trim().default(""),
  tag_audio_events: z.boolean().default(true),
  diarize: z.boolean().default(true),
});

function isSoundEffectModerationError(error: unknown) {
  const message =
    error instanceof KieApiError
      ? error.message.toLowerCase()
      : error instanceof Error
        ? error.message.toLowerCase()
        : String(error).toLowerCase();

  return (
    message.includes("request_blocked_due_to_moderation") ||
    message.includes("violate our terms of service") ||
    message.includes("sound generation may violate")
  );
}

function buildSoundEffectRetryText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();
  if (
    normalized.includes("ხმა") ||
    normalized.includes("sound") ||
    normalized.includes("effect") ||
    normalized.includes("ეფექტ")
  ) {
    return trimmed;
  }

  const containsGeorgian = /[\u10A0-\u10FF]/.test(trimmed);
  return containsGeorgian ? `${trimmed} ხმა` : `${trimmed} sound effect`;
}

async function prepareSoundEffectInput(params: z.infer<typeof soundEffectSchema>) {
  let translatedText = params.text;

  try {
    translatedText = await translateSoundEffectPromptToEnglish(params.text);
  } catch (error) {
    console.warn("POST /api/ai/audio/generate sfx translation fallback", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    ...params,
    text: translatedText,
  };
}

function getPublicAudioFailureMessage(
  tool: "sfx" | "isolation" | "transcription" | null
) {
  switch (tool) {
    case "transcription":
      return "სამწუხაროდ ტრანსკრიფცია ვერ მოხერხდა. სცადეთ თავიდან";
    case "isolation":
      return "სამწუხაროდ ხმის იზოლაცია ვერ მოხერხდა. სცადეთ თავიდან";
    default:
      return "სამწუხაროდ გენერაცია ვერ მოხერხდა. სცადეთ თავიდან";
  }
}

const ACCEPTED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".aac",
  ".mp4",
  ".ogg",
  ".mpeg",
  ".m4a",
] as const;

const AUDIO_MIME_BY_EXTENSION: Record<(typeof ACCEPTED_AUDIO_EXTENSIONS)[number], string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".mp4": "audio/mp4",
  ".ogg": "audio/ogg",
  ".mpeg": "audio/mpeg",
  ".m4a": "audio/mp4",
};

function isAudioSchemaDbError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes("audio") ||
    message.includes("outputtext") ||
    message.includes("outputdata") ||
    message.includes("generationtype") ||
    message.includes("invalid value for argument `type`")
  );
}

function getAudioRouteErrorMessage(
  error: unknown,
  tool: "sfx" | "isolation" | "transcription" | null = null
) {
  if (error instanceof ApiError) {
    return error.userMessage;
  }

  if (error instanceof KieApiError) {
    const message = error.message.toLowerCase();

    if (tool === "sfx" && isSoundEffectModerationError(error)) {
      return "ეს მოთხოვნა ხმოვანი ეფექტების უსაფრთხოების ფილტრმა დაბლოკა. სცადეთ უფრო ნეიტრალური ან უფრო კონკრეტული აღწერა.";
    }

    if (
      error.statusCode === 402 ||
      message.includes("insufficient") ||
      message.includes("credit")
    ) {
      return "Kie.ai ბალანსი არასაკმარისია. დაუკავშირდით ადმინისტრატორს";
    }

    if (error.statusCode === 401 || message.includes("auth") || message.includes("token")) {
      return "Kie.ai ავტორიზაცია ვერ მოხერხდა";
    }

    if (error.statusCode === 422 || message.includes("validation")) {
      return getPublicAudioFailureMessage(tool);
    }

    if (
      error.statusCode === 404 ||
      message.includes("no message available") ||
      message.includes("not found")
    ) {
      return "აუდიო ფაილის ატვირთვა ვერ შესრულდა. სცადეთ თავიდან";
    }

    if (error.statusCode === 429 || message.includes("rate")) {
      return "Kie.ai დროებით გადატვირთულია. სცადეთ ცოტა მოგვიანებით";
    }

    if (error.statusCode === 455 || error.statusCode === 500 || error.statusCode === 501) {
      return getPublicAudioFailureMessage(tool);
    }

    return getPublicAudioFailureMessage(tool);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    const message = error.message.toLowerCase();

    if (
      message.includes("audio") ||
      message.includes("outputtext") ||
      message.includes("outputdata")
    ) {
      return "აუდიო მონაცემთა ბაზის ცვლილებები ჯერ ბოლომდე არ არის გაშვებული";
    }

    return "მონაცემთა ბაზის ვალიდაცია ვერ შესრულდა";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `მონაცემთა ბაზის შეცდომა: ${error.code}`;
  }

    if (error instanceof Error) {
      return getPublicAudioFailureMessage(tool);
    }

    return "დროებითი შეფერხება. გთხოვთ სცადოთ მოგვიანებით";
  }

function getAudioModelId(tool: "sfx" | "isolation" | "transcription"): AudioToolId {
  switch (tool) {
    case "sfx":
      return "audio_sfx";
    case "isolation":
      return "audio_isolation";
    case "transcription":
      return "audio_transcription";
  }
}

function getPromptPreview(
  tool: "sfx" | "isolation" | "transcription",
  params: unknown
) {
  if (tool === "sfx") {
    return (params as z.infer<typeof soundEffectSchema>).text;
  }

  return null;
}

function getFileExtension(fileName: string) {
  const normalized = fileName.toLowerCase();
  const found = ACCEPTED_AUDIO_EXTENSIONS.find((extension) =>
    normalized.endsWith(extension)
  );

  return found ?? null;
}

function assertAudioFile(file: File, maxSizeMb: number) {
  const extension = getFileExtension(file.name);

  if (!extension) {
    throw new ApiError(400, "მხარდაჭერილია მხოლოდ MP3, WAV, AAC, MP4, OGG და MPEG ფაილები");
  }

  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ApiError(400, `ფაილის ზომა არ უნდა აღემატებოდეს ${maxSizeMb}MB-ს`);
  }
}

function inferAudioMimeType(file: File) {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }

  const extension = getFileExtension(file.name);
  if (!extension) {
    return "application/octet-stream";
  }

  return AUDIO_MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

function normalizeUploadFileName(fileName: string) {
  const extension = getFileExtension(fileName) ?? "";
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  const safeBaseName =
    baseName
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "audio-file";

  return `${safeBaseName}${extension}`;
}

async function parseRequestPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payloadValue = formData.get("payload");
    const fileValue = formData.get("file");

    if (typeof payloadValue !== "string") {
      throw new ApiError(400, "payload აუცილებელია");
    }

    const parsedPayload = jsonEnvelopeSchema.safeParse(JSON.parse(payloadValue));

    if (!parsedPayload.success) {
      return {
        payload: null,
        file: null,
        error: parsedPayload.error.issues[0]?.message ?? "მონაცემები არასწორია",
      };
    }

    return {
      payload: parsedPayload.data,
      file: fileValue instanceof File ? fileValue : null,
      error: null,
    };
  }

  const body = await parseJsonBody(request);
  const parsedPayload = jsonEnvelopeSchema.safeParse(body);

  if (!parsedPayload.success) {
    return {
      payload: null,
      file: null,
      error: parsedPayload.error.issues[0]?.message ?? "მონაცემები არასწორია",
    };
  }

  return {
    payload: parsedPayload.data,
    file: null,
    error: null,
  };
}

export async function POST(request: NextRequest) {
  let requestedTool: "sfx" | "isolation" | "transcription" | null = null;

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const { payload, file, error } = await parseRequestPayload(request);

    if (!payload) {
      return validationErrorResponse({
        payload: error ?? "მონაცემები არასწორია",
      });
    }

    requestedTool = payload.tool;

    const modelId = getAudioModelId(payload.tool);
    const model = AUDIO_MODELS[modelId];

    const hasCredits = await hasEnoughCredits(auth.userId, model.coins);
    if (!hasCredits) {
      throw new ApiError(400, "კრედიტები არ არის საკმარისი");
    }

    let parsedParams:
      | z.infer<typeof soundEffectSchema>
      | z.infer<typeof transcriptionSchema>;

    switch (payload.tool) {
      case "sfx": {
        const parsed = soundEffectSchema.safeParse(payload.params);
        if (!parsed.success) {
          return validationErrorResponse({
            params: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია",
          });
        }
        parsedParams = normalizeSoundEffectParams(parsed.data);
        break;
      }
      case "isolation": {
        if (!file) {
          return validationErrorResponse({
            file: "აუდიო ფაილი აუცილებელია",
          });
        }
        assertAudioFile(file, 10);
        parsedParams = { language_code: "", tag_audio_events: false, diarize: false };
        break;
      }
      case "transcription": {
        if (!file) {
          return validationErrorResponse({
            file: "აუდიო ფაილი აუცილებელია",
          });
        }
        assertAudioFile(file, 200);
        const parsed = transcriptionSchema.safeParse(payload.params);
        if (!parsed.success) {
          return validationErrorResponse({
            params: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია",
          });
        }
        parsedParams = parsed.data;
        break;
      }
    }

    const promptPreview = getPromptPreview(payload.tool, parsedParams);
    let generation: {
      id: string;
      creditsCost: number;
    } | null = null;

    generation = await prisma.$transaction(
      async (tx) => {
        const createdGeneration = await tx.generation.create({
          data: {
            userId: auth.userId,
            type: "AUDIO",
            modelId,
            prompt: promptPreview,
            status: "PROCESSING",
            creditsCost: model.coins,
          },
          select: {
            id: true,
            creditsCost: true,
          },
        });

        await deductCreditsWithClient(
          tx,
          auth.userId,
          model.coins,
          `${model.name} - აუდიო ინსტრუმენტი`,
          modelId,
          createdGeneration.id
        );

        return createdGeneration;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    if (!generation) {
      throw new ApiError(500, "გენერაციის შექმნა ვერ მოხერხდა");
    }

    try {
      let input: Record<string, unknown>;
      let sourceUrl: string | null = null;
      let soundEffectRetryInput: Record<string, unknown> | null = null;

      if (payload.tool === "sfx") {
        const sfxParams = parsedParams as z.infer<typeof soundEffectSchema>;
        input = await prepareSoundEffectInput(sfxParams);
        const retryText = buildSoundEffectRetryText(input.text as string);
        soundEffectRetryInput =
          retryText !== input.text
            ? {
                ...input,
                text: retryText,
              }
            : null;
      } else {
        const uploadFileName = normalizeUploadFileName(file!.name);
        const uploadUrl = await uploadAudioFileToKie({
          fileBuffer: await file!.arrayBuffer(),
          fileName: uploadFileName,
          mimeType: inferAudioMimeType(file!),
          uploadPath: `audio-inputs/${auth.userId}`,
        });

        sourceUrl = uploadUrl;

        if (payload.tool === "isolation") {
          input = { audio_url: uploadUrl };
        } else {
          const tp = parsedParams as z.infer<typeof transcriptionSchema>;
          input = {
            audio_url: uploadUrl,
            tag_audio_events: tp.tag_audio_events,
            diarize: tp.diarize,
            // Omit language_code when empty — ElevenLabs API prefers missing over ""
            ...(tp.language_code ? { language_code: tp.language_code } : {}),
          };
          console.log("[Transcription] task input →", {
            audio_url: uploadUrl,
            language_code: tp.language_code || "(auto-detect)",
            tag_audio_events: tp.tag_audio_events,
            diarize: tp.diarize,
          });
        }
      }

      const runAudioTask = async (taskInput: Record<string, unknown>) => {
        const taskId = await createAudioTask({
          model: model.kieModel,
          input: taskInput,
        });

        return waitForAudioTaskResult(taskId, model.tool);
      };

      let taskResult;

      try {
        taskResult = await runAudioTask(input);
      } catch (error) {
        if (
          payload.tool === "sfx" &&
          soundEffectRetryInput &&
          isSoundEffectModerationError(error)
        ) {
          console.warn("POST /api/ai/audio/generate sfx retrying with safer wording", {
            originalText: (input.text as string | undefined) ?? null,
            retryText: soundEffectRetryInput.text,
          });

          taskResult = await runAudioTask(soundEffectRetryInput);
        } else if (
          payload.tool === "transcription" &&
          input.language_code &&
          typeof sourceUrl === "string" &&
          error instanceof KieApiError
        ) {
          console.warn(
            "POST /api/ai/audio/generate transcription retrying with auto language detection",
            {
              fileName: file?.name,
              requestedLanguageCode: input.language_code,
            }
          );

          taskResult = await runAudioTask({
            audio_url: sourceUrl,
            // Omit language_code entirely for auto-detect retry
            tag_audio_events: input.tag_audio_events,
            diarize: input.diarize,
          });
        } else {
          throw error;
        }
      }

      if (taskResult.kind === "audio") {
        const bunnyUrl =
          (await persistToBunnyStorage(
            taskResult.url,
            "AUDIO",
            auth.userId,
            generation.id
          )) ?? taskResult.url;

        try {
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: "SUCCEEDED",
              externalId: taskResult.taskId,
              outputUrl: bunnyUrl,
              sourceUrl,
            },
          });
        } catch (updateError) {
          if (!isAudioSchemaDbError(updateError)) {
            throw updateError;
          }
        }

        return NextResponse.json({
          generationId: generation.id,
          status: "SUCCEEDED",
          outputUrl: bunnyUrl,
          outputText: null,
          outputData: null,
          creditsUsed: generation.creditsCost,
        });
      }

      const transcriptBuffer = new TextEncoder().encode(taskResult.text);
      let transcriptUrl: string | null = null;

      try {
        transcriptUrl = await uploadToStorage(
          transcriptBuffer.buffer as ArrayBuffer,
          `generations/transcripts/${auth.userId}/${generation.id}.txt`
        );
      } catch (storageError) {
        if (storageError instanceof BunnyStorageError && storageError.statusCode === 401) {
          warnBunnyUnauthorizedOnce("audio transcription transcript fallback");
        } else {
          console.warn(
            "POST /api/ai/audio/generate transcript storage fallback",
            storageError
          );
        }
      }

      try {
        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: "SUCCEEDED",
            externalId: taskResult.taskId,
            outputUrl: transcriptUrl,
            outputText: taskResult.text,
            outputData: taskResult.segments,
            sourceUrl,
          },
        });
      } catch (updateError) {
        if (isAudioSchemaDbError(updateError)) {
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: "SUCCEEDED",
              externalId: taskResult.taskId,
              outputUrl: transcriptUrl,
              sourceUrl,
            },
          });
        } else {
          throw updateError;
        }
      }

      return NextResponse.json({
        generationId: generation.id,
        status: "SUCCEEDED",
        outputUrl: transcriptUrl,
        outputText: taskResult.text,
        outputData: taskResult.segments,
        creditsUsed: generation.creditsCost,
      });
    } catch (error) {
      const message =
        error instanceof KieApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "აუდიო გენერაცია ვერ შესრულდა";

      console.error("[Audio Generate] inner error", {
        tool: payload.tool,
        errorType: error instanceof KieApiError ? "KieApiError" : error instanceof Error ? error.constructor.name : typeof error,
        message,
        statusCode: error instanceof KieApiError ? error.statusCode : undefined,
        details: error instanceof KieApiError ? error.details : undefined,
      });

      const publicMessage = getAudioRouteErrorMessage(error, payload.tool);

      await refundKieGenerationCredits(
        {
          userId: auth.userId,
          generationId: generation.id,
          amount: generation.creditsCost,
          modelUsed: modelId,
        },
        publicMessage
      );

      throw error;
    }
  } catch (error) {
    const mappedMessage = getAudioRouteErrorMessage(error, requestedTool);
    if (error instanceof ApiError) {
      return handleApiError(
        new ApiError(error.statusCode, mappedMessage, error.fieldErrors),
        "POST /api/ai/audio/generate failed"
      );
    }

    if (error instanceof KieApiError) {
      const rawStatusCode = error.statusCode ?? 500;
      const statusCode =
        rawStatusCode >= 400 && rawStatusCode < 600 ? rawStatusCode : 500;

      console.error("╔══ KIE.AI ERROR ══════════════════════════════════╗");
      console.error("║ tool:", requestedTool);
      console.error("║ message:", error.message);
      console.error("║ statusCode:", error.statusCode);
      console.error("║ details:", JSON.stringify(error.details, null, 2));
      console.error("╚══════════════════════════════════════════════════╝");

      return handleApiError(
        new ApiError(statusCode, mappedMessage),
        "POST /api/ai/audio/generate failed"
      );
    }

    if (mappedMessage !== "დროებითი შეფერხება. გთხოვთ სცადოთ მოგვიანებით") {
      return handleApiError(
        new ApiError(500, mappedMessage),
        "POST /api/ai/audio/generate failed"
      );
    }

    return handleApiError(error, "POST /api/ai/audio/generate failed");
  }
}
