import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatRatingValue } from "@/lib/review-constants";

const reviewPublicSelect = {
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
} satisfies Prisma.ReviewSelect;

type ReviewWithUser = Prisma.ReviewGetPayload<{
  select: typeof reviewPublicSelect;
}>;

export type SerializedReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  isOwnReview: boolean;
};

export type CourseRatingSummary = {
  averageRating: number | null;
  totalReviews: number;
};

export type CourseRatingSummaryLite = {
  averageRating: number | null;
  totalReviews: number;
};

export type CourseReviewsResult = {
  reviews: SerializedReview[];
  totalReviews: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest";

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export function serializeReview(
  review: ReviewWithUser,
  currentUserId?: string | null
): SerializedReview {
  return {
    id: review.id,
    rating: Number(review.rating),
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    user: {
      id: review.user.id,
      name: review.user.name,
      avatarUrl: review.user.avatarUrl,
    },
    isOwnReview: currentUserId === review.user.id,
  };
}

export async function getCourseRatingSummary(
  courseId: string
): Promise<CourseRatingSummary> {
  const aggregate = await prisma.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    averageRating: toNumber(aggregate._avg.rating),
    totalReviews: aggregate._count._all,
  };
}

export async function getCourseRatingSummaries(
  courseIds: string[]
): Promise<Record<string, CourseRatingSummaryLite>> {
  if (courseIds.length === 0) {
    return {};
  }

  const rows = await prisma.review.groupBy({
    by: ["courseId"],
    where: {
      courseId: {
        in: courseIds,
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  return Object.fromEntries(
    rows.map((row) => [
      row.courseId,
      {
        averageRating: toNumber(row._avg.rating),
        totalReviews: row._count._all,
      },
    ])
  );
}

function getReviewOrderBy(sort: ReviewSort): Prisma.ReviewOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "highest":
      return [{ rating: "desc" }, { createdAt: "desc" }];
    case "lowest":
      return [{ rating: "asc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function getCourseReviews(params: {
  courseId: string;
  currentUserId?: string | null;
  page?: number;
  limit?: number;
  sort?: ReviewSort;
}): Promise<CourseReviewsResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;
  const sort = params.sort ?? "newest";

  const [reviews, totalReviews] = await Promise.all([
    prisma.review.findMany({
      where: { courseId: params.courseId },
      orderBy: getReviewOrderBy(sort),
      skip,
      take: limit,
      select: reviewPublicSelect,
    }),
    prisma.review.count({
      where: { courseId: params.courseId },
    }),
  ]);

  return {
    reviews: reviews.map((review) => serializeReview(review, params.currentUserId)),
    totalReviews,
    page,
    limit,
    hasMore: skip + reviews.length < totalReviews,
  };
}

export async function getCourseReviewByUser(params: {
  courseId: string;
  userId: string;
}): Promise<SerializedReview | null> {
  const review = await prisma.review.findUnique({
    where: {
      userId_courseId: {
        userId: params.userId,
        courseId: params.courseId,
      },
    },
    select: reviewPublicSelect,
  });

  if (!review) {
    return null;
  }

  return serializeReview(review, params.userId);
}

export async function getCourseReviewsSectionData(params: {
  courseId: string;
  currentUserId?: string | null;
  limit?: number;
}): Promise<{
  summary: CourseRatingSummary;
  reviews: SerializedReview[];
  currentUserReview: SerializedReview | null;
}> {
  const currentUserId = params.currentUserId ?? null;
  const [summary, reviewsResult, currentUserReview] = await Promise.all([
    getCourseRatingSummary(params.courseId),
    getCourseReviews({
      courseId: params.courseId,
      currentUserId,
      limit: params.limit ?? 10,
      page: 1,
      sort: "newest",
    }),
    currentUserId
      ? getCourseReviewByUser({
          courseId: params.courseId,
          userId: currentUserId,
        })
      : Promise.resolve(null),
  ]);

  return {
    summary,
    reviews: reviewsResult.reviews,
    currentUserReview,
  };
}

export async function getAdminReviews(params: {
  query?: string;
  rating?: string;
}) {
  const query = params.query?.trim() ?? "";
  const rating = params.rating?.trim() ?? "";

  const where: Prisma.ReviewWhereInput = {};

  if (query) {
    where.OR = [
      {
        user: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        course: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (rating) {
    where.rating = new Prisma.Decimal(rating);
  }

  return prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}
