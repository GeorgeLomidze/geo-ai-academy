import { NextRequest, NextResponse } from "next/server";
import { handleApiError, notFoundResponse } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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
      select: { id: true },
    });

    if (!generation) {
      return notFoundResponse();
    }

    await prisma.generation.delete({
      where: { id: generation.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/ai/[generationId] failed");
  }
}
