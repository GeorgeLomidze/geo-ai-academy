import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  forbiddenResponse,
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  getCourseRatingSummary,
  getCourseReviews,
  serializeReview,
} from "@/lib/reviews";
import { reviewListQuerySchema, reviewUpsertSchema, getZodFieldErrors } from "@/lib/validations/review";

async function getOptionalUserId(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Route Handlers can't update the request cookies.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

function revalidateReviewPaths(courseSlug: string) {
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath("/admin/reviews");
}

export async function GET(request: NextRequest) {
  try {
    const parsed = reviewListQuerySchema.safeParse({
      courseId: request.nextUrl.searchParams.get("courseId"),
      limit: request.nextUrl.searchParams.get("limit") ?? "10",
      page: request.nextUrl.searchParams.get("page") ?? "1",
      sort: request.nextUrl.searchParams.get("sort") ?? "newest",
    });

    if (!parsed.success) {
      const fieldErrors = getZodFieldErrors(parsed.error);
      return validationErrorResponse(fieldErrors);
    }

    const currentUserId = await getOptionalUserId(request);
    const { courseId, limit, page, sort } = parsed.data;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      return notFoundResponse();
    }

    const [summary, result] = await Promise.all([
      getCourseRatingSummary(courseId),
      getCourseReviews({
        courseId,
        currentUserId,
        limit,
        page,
        sort,
      }),
    ]);

    return NextResponse.json({
      summary,
      reviews: result.reviews,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
      totalReviews: result.totalReviews,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/reviews failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const body = await parseJsonBody(request);

    const parsed = reviewUpsertSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = getZodFieldErrors(parsed.error);
      return validationErrorResponse(fieldErrors);
    }

    const { courseId, rating, comment } = parsed.data;

    const [course, enrollment, existingReview] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          slug: true,
          title: true,
        },
      }),
      prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: auth.userId,
            courseId,
          },
        },
        select: { id: true },
      }),
      prisma.review.findUnique({
        where: {
          userId_courseId: {
            userId: auth.userId,
            courseId,
          },
        },
        select: { id: true },
      }),
    ]);

    if (!course) {
      return notFoundResponse();
    }

    if (!enrollment) {
      return forbiddenResponse();
    }

    const review = await prisma.review.upsert({
      where: {
        userId_courseId: {
          userId: auth.userId,
          courseId,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId: auth.userId,
        courseId,
        rating,
        comment,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const summary = await getCourseRatingSummary(courseId);
    revalidateReviewPaths(course.slug);

    return NextResponse.json(
      {
        success: true,
        action: existingReview ? "updated" : "created",
        message: existingReview
          ? "შეფასება წარმატებით განახლდა"
          : "შეფასება წარმატებით დაემატა",
        review: serializeReview(review, auth.userId),
        summary,
      },
      { status: existingReview ? 200 : 201 }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/reviews failed");
  }
}
