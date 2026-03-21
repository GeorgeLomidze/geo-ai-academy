import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const projects = await prisma.project.findMany({
      where: { userId: auth.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return handleApiError(error, "GET /api/projects failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const project = await prisma.project.create({
      data: {
        userId: auth.userId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/projects failed");
  }
}
