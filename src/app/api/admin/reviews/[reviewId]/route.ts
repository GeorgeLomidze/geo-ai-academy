import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError, notFoundResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

interface AdminReviewRouteContext {
  params: Promise<{ reviewId: string }>;
}

function revalidateReviewPaths(courseSlug: string) {
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath("/admin/reviews");
}

export async function DELETE(
  request: NextRequest,
  context: AdminReviewRouteContext
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { reviewId } = await context.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        course: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!review) {
      return notFoundResponse();
    }

    await prisma.review.delete({
      where: { id: review.id },
    });

    revalidateReviewPaths(review.course.slug);

    return NextResponse.json({
      success: true,
      message: "შეფასება წარმატებით წაიშალა",
    });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/reviews/[reviewId] failed");
  }
}
