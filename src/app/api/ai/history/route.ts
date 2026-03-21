import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { getModelMetadata } from "@/lib/credits/pricing";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [total, generations] = await Promise.all([
      prisma.generation.count({
        where: { userId: auth.userId },
      }),
      prisma.generation.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          modelId: true,
          type: true,
          status: true,
          outputUrl: true,
          creditsCost: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      generations: generations.map((generation) => ({
        id: generation.id,
        modelId: generation.modelId,
        modelName:
          getModelMetadata(generation.modelId)?.name ?? generation.modelId,
        type: generation.type,
        status: generation.status,
        outputUrl: generation.outputUrl,
        creditsUsed: generation.creditsCost,
        date: generation.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/ai/history failed");
  }
}
