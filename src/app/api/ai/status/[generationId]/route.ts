import { NextRequest, NextResponse } from "next/server";
import { handleApiError, notFoundResponse } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { persistToBunnyStorage } from "@/lib/bunny/storage";
import { getTaskStatus } from "@/lib/kie/client";
import { syncGenerationStatus } from "@/lib/kie/callback";
import { prisma } from "@/lib/prisma";

/** Max time (ms) a generation can stay in PROCESSING before being auto-failed */
const STALE_GENERATION_TIMEOUT_MS = 10 * 60 * 1000;

function isTerminalStatus(status: string) {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELED";
}

function isFailedState(state: string) {
  const normalized = state.toLowerCase();
  return normalized === "failed" || normalized === "error";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ generationId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const { generationId } = await context.params;

    const generation = await prisma.generation.findFirst({
      where: {
        id: generationId,
        userId: auth.userId,
      },
      select: {
        id: true,
        type: true,
        status: true,
        externalId: true,
        modelId: true,
        outputUrl: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    if (!generation) {
      return notFoundResponse();
    }

    // Auto-fail stale generations stuck in PROCESSING for too long
    if (
      !isTerminalStatus(generation.status) &&
      Date.now() - generation.createdAt.getTime() > STALE_GENERATION_TIMEOUT_MS
    ) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "FAILED",
          errorMessage: "გენერაცია ვერ შესრულდა დროის ლიმიტის გამო",
        },
      });

      return NextResponse.json({
        status: "FAILED",
        outputUrl: null,
        errorMessage: "გენერაცია ვერ შესრულდა დროის ლიმიტის გამო",
      });
    }

    if (
      !isTerminalStatus(generation.status) &&
      generation.externalId
    ) {
      try {
        const taskStatus = await getTaskStatus(
          generation.externalId,
          generation.type === "IMAGE" ? "image" : "video",
          generation.modelId
        );

        const isTerminal = taskStatus.success || isFailedState(taskStatus.state);

        if (isTerminal) {
          await syncGenerationStatus({
            taskId: generation.externalId,
            success: taskStatus.success,
            resultUrls: taskStatus.resultUrls,
            errorMessage: taskStatus.errorMessage,
          });
        } else if (generation.status === "PENDING") {
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: "PROCESSING",
            },
          });
        }
      } catch {
        // KIE status API can return errors for tasks still processing
        // (e.g. code 422 "recordInfo is null"). Fall through to return DB status.
      }

      const refreshedGeneration = await prisma.generation.findUnique({
        where: { id: generation.id },
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          outputUrl: true,
          errorMessage: true,
        },
      });

      if (!refreshedGeneration) {
        return notFoundResponse();
      }

      // If just transitioned to SUCCEEDED with a non-Bunny URL, persist in background
      if (
        refreshedGeneration.status === "SUCCEEDED" &&
        refreshedGeneration.outputUrl &&
        !refreshedGeneration.outputUrl.includes(process.env.BUNNY_CDN_URL ?? "b-cdn.net")
      ) {
        const genType = refreshedGeneration.type as "IMAGE" | "VIDEO";
        void persistToBunnyStorage(
          refreshedGeneration.outputUrl,
          genType,
          refreshedGeneration.userId,
          refreshedGeneration.id
        )
          .then(async (bunnyUrl) => {
            if (bunnyUrl) {
              await prisma.generation.update({
                where: { id: refreshedGeneration.id },
                data: { outputUrl: bunnyUrl },
              });
            }
          })
          .catch((err) => {
            console.error("[BunnyStorage] Background persist failed:", err);
          });
      }

      return NextResponse.json({
        status: refreshedGeneration.status,
        outputUrl: refreshedGeneration.outputUrl ?? null,
        errorMessage: refreshedGeneration.errorMessage ?? null,
      });
    }

    return NextResponse.json({
      status: generation.status,
      outputUrl: generation.outputUrl ?? null,
      errorMessage: generation.errorMessage ?? null,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/ai/status/[generationId] failed");
  }
}
