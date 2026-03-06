import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getCourseRatingSummary } from "@/lib/reviews";

function revalidateReviewPaths(courseSlug: string) {
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath("/admin/reviews");
}

interface ReviewRouteContext {
  params: Promise<{ reviewId: string }>;
}

export async function DELETE(
  request: NextRequest,
  context: ReviewRouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const { reviewId } = await context.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        courseId: true,
        course: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "შეფასება ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    if (review.userId !== auth.userId) {
      return NextResponse.json(
        { error: "თქვენ მხოლოდ საკუთარ შეფასებას წაშლით" },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id: review.id },
    });

    const summary = await getCourseRatingSummary(review.courseId);
    revalidateReviewPaths(review.course.slug);

    return NextResponse.json({
      success: true,
      message: "შეფასება წარმატებით წაიშალა",
      summary,
    });
  } catch (error) {
    console.error("DELETE /api/reviews/[reviewId] failed", error);
    return NextResponse.json(
      { error: "შეფასების წაშლა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
