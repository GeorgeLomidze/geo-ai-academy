import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  forbiddenResponse,
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const progressSchema = z
  .object({
    lessonId: z.string().uuid("არასწორი გაკვეთილის ID"),
    watchedSeconds: z.number().int().min(0).optional(),
    completed: z.boolean().optional(),
  })
  .refine(
    (data) => data.watchedSeconds !== undefined || data.completed !== undefined,
    {
      message: "განახლებისთვის მინიმუმ ერთი ველი აუცილებელია",
    }
  );

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const body = await parseJsonBody(request);
    const parsed = progressSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse({
        [String(parsed.error.issues[0]?.path[0] ?? "lessonId")]:
          parsed.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const { lessonId, watchedSeconds, completed } = parsed.data;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        module: {
          select: {
            course: {
              select: {
                id: true,
                enrollments: {
                  where: { userId: auth.userId },
                  select: { id: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return notFoundResponse();
    }

    if (lesson.module.course.enrollments.length === 0) {
      return forbiddenResponse();
    }

    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: auth.userId,
          lessonId,
        },
      },
    });

    const nextWatchedSeconds = Math.max(
      existingProgress?.watchedSeconds ?? 0,
      watchedSeconds ?? 0
    );
    const nextCompleted = existingProgress?.completed || completed || false;
    const nextCompletedAt = nextCompleted
      ? existingProgress?.completedAt ?? new Date()
      : null;

    const progress = existingProgress
      ? await prisma.lessonProgress.update({
          where: {
            userId_lessonId: {
              userId: auth.userId,
              lessonId,
            },
          },
          data: {
            watchedSeconds: nextWatchedSeconds,
            completed: nextCompleted,
            completedAt: nextCompletedAt,
          },
        })
      : await prisma.lessonProgress.create({
          data: {
            userId: auth.userId,
            lessonId,
            watchedSeconds: nextWatchedSeconds,
            completed: nextCompleted,
            completedAt: nextCompletedAt,
          },
        });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    return handleApiError(error, "POST /api/progress failed");
  }
}
