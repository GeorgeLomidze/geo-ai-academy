import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  badRequestResponse,
  conflictResponse,
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createCheckoutUrl } from "@/lib/flitt/client";
import { siteConfig } from "@/lib/constants";

const checkoutSchema = z.object({
  courseId: z.string().uuid("არასწორი კურსის ID"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const body = await parseJsonBody(request);

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse({ courseId: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები" });
    }

    const { courseId } = parsed.data;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, status: true },
    });

    if (!course) {
      return notFoundResponse();
    }

    if (course.status !== "PUBLISHED") {
      return badRequestResponse();
    }

    if (course.price === 0) {
      return badRequestResponse();
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: auth.userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return conflictResponse();
    }

    const order = await prisma.order.create({
      data: {
        userId: auth.userId,
        courseId,
        amount: course.price,
        currency: "GEL",
        status: "PENDING",
      },
    });

    const baseUrl = siteConfig.url;
    const { checkoutUrl, paymentId } = await createCheckoutUrl({
      orderId: order.id,
      amount: course.price,
      currency: "GEL",
      description: `GEO AI Academy - ${course.title}`,
      callbackUrl: `${baseUrl}/api/webhooks/flitt`,
      responseUrl: `${baseUrl}/api/checkout/success`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { flittPaymentId: paymentId },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return handleApiError(error, "POST /api/checkout failed");
  }
}
