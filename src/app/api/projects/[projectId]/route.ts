import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  handleApiError,
  notFoundResponse,
  parseJsonBody,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  nodes: z.array(z.unknown()).optional(),
  thumbnail: z.string().url().nullable().optional(),
});

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const { projectId } = await context.params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId },
    });

    if (!project) return notFoundResponse();

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error, "GET /api/projects/[projectId] failed");
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const { projectId } = await context.params;

    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId },
      select: { id: true },
    });

    if (!existing) return notFoundResponse();

    const body = await parseJsonBody(request);
    const data = updateSchema.parse(body);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.nodes !== undefined ? { nodes: data.nodes as unknown as import("@prisma/client").Prisma.InputJsonValue } : {}),
        ...(data.thumbnail !== undefined
          ? { thumbnail: data.thumbnail }
          : {}),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error, "PUT /api/projects/[projectId] failed");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const { projectId } = await context.params;

    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId },
      select: { id: true },
    });

    if (!existing) return notFoundResponse();

    await prisma.project.delete({ where: { id: projectId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/projects/[projectId] failed");
  }
}
