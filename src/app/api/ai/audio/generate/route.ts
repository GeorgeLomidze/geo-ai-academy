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
import { persistToBunnyStorage, uploadToStorage } from "@/lib/bunny/storage";
import { deductCreditsWithClient, hasEnoughCredits } from "@/lib/credits/manager";
import { AUDIO_MODELS, type AudioToolId } from "@/lib/credits/pricing";
import { refundKieGenerationCredits } from "@/lib/kie/callback";
import {
  createAudioTask,
  uploadAudioFileToKie,
  waitForAudioTaskResult,
} from "@/lib/kie/audio";
import { KieApiError } from "@/lib/kie/client";
import { prisma } from "@/lib/prisma";

const jsonEnvelopeSchema = z.object({
  tool: z.enum(["sfx", "isolation", "transcription"]),
  params: z.record(z.string(), z.unknown()).default({}),
});

const soundEffectSchema = z.object({
  text: z.string().trim().min(1, "აღწერა აუცილებელია"),
  loop: z.boolean().default(false),
  duration_seconds: z.number().min(0.5).max(22).default(11.25),
  prompt_influence: z.number().min(0).max(1).default(0.3),
  output_format: z.string().trim().default("mp3_44100_128"),
});

const transcriptionSchema = z.object({
  language_code: z.string().trim().default(""),
  tag_audio_events: z.boolean().default(true),
  diarize: z.boolean().default(true),
});

const ACCEPTED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".aac",
  ".mp4",
  ".ogg",
  ".mpeg",
  ".m4a",
] as const;

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

function getAudioRouteErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.userMessage;
  }

  if (error instanceof KieApiError) {
    const message = error.message.toLowerCase();

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
      return error.message;
    }

    if (error.statusCode === 429 || message.includes("rate")) {
      return "Kie.ai დროებით გადატვირთულია. სცადეთ ცოტა მოგვიანებით";
    }

    if (error.statusCode === 455 || error.statusCode === 500 || error.statusCode === 501) {
      return `Kie.ai შეცდომა: ${error.message}`;
    }

    return error.message;
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
    return error.message;
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
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const { payload, file, error } = await parseRequestPayload(request);

    if (!payload) {
      return validationErrorResponse({
        payload: error ?? "მონაცემები არასწორია",
      });
    }

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
        parsedParams = parsed.data;
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

      if (payload.tool === "sfx") {
        input = parsedParams as z.infer<typeof soundEffectSchema>;
      } else {
        const uploadUrl = await uploadAudioFileToKie({
          fileBuffer: await file!.arrayBuffer(),
          fileName: file!.name,
          mimeType: file!.type || "application/octet-stream",
          uploadPath: `audio-inputs/${auth.userId}`,
        });

        sourceUrl = uploadUrl;

        input =
          payload.tool === "isolation"
            ? { audio_url: uploadUrl }
            : {
                audio_url: uploadUrl,
                language_code: (parsedParams as z.infer<typeof transcriptionSchema>).language_code,
                tag_audio_events: (parsedParams as z.infer<typeof transcriptionSchema>).tag_audio_events,
                diarize: (parsedParams as z.infer<typeof transcriptionSchema>).diarize,
              };
      }

      const taskId = await createAudioTask({
        model: model.kieModel,
        input,
      });

      const taskResult = await waitForAudioTaskResult(taskId, model.tool);

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
              externalId: taskId,
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
      const transcriptUrl = await uploadToStorage(
        transcriptBuffer.buffer as ArrayBuffer,
        `generations/transcripts/${auth.userId}/${generation.id}.txt`
      );

      try {
        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: "SUCCEEDED",
            externalId: taskId,
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
              externalId: taskId,
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

      await refundKieGenerationCredits(
        {
          userId: auth.userId,
          generationId: generation.id,
          amount: generation.creditsCost,
          modelUsed: modelId,
        },
        message
      );

      throw error;
    }
  } catch (error) {
    const mappedMessage = getAudioRouteErrorMessage(error);
    if (mappedMessage !== "დროებითი შეფერხება. გთხოვთ სცადოთ მოგვიანებით") {
      return handleApiError(new ApiError(500, mappedMessage), "POST /api/ai/audio/generate failed");
    }
    return handleApiError(error, "POST /api/ai/audio/generate failed");
  }
}
