import { prisma } from "@/lib/prisma";
import {
  COURSE_BONUS_CREDITS,
  grantCourseBonusWithClient,
} from "@/lib/credits/manager";
import { sendPurchaseEmail } from "@/lib/email/send";
import { logDebug } from "@/lib/logger";

export async function fulfillOrder(
  orderId: string,
  flittPaymentId?: string,
): Promise<boolean> {
  logDebug("[fulfillOrder] Starting", { orderId });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      amount: true,
      user: { select: { email: true, name: true } },
      course: { select: { title: true } },
    },
  });

  if (!order) {
    console.error("[fulfillOrder] Order not found:", orderId);
    return false;
  }

  if (order.status === "PAID") {
    logDebug("[fulfillOrder] Already fulfilled", { orderId });
    return true;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.order.updateMany({
      where: {
        id: order.id,
        status: {
          not: "PAID",
        },
      },
      data: {
        status: "PAID",
        flittOrderId: orderId,
        flittPaymentId: flittPaymentId ?? undefined,
      },
    });

    if (updateResult.count === 0) {
      return { newlyFulfilled: false };
    }

    await tx.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: order.userId,
          courseId: order.courseId,
        },
      },
      create: {
        userId: order.userId,
        courseId: order.courseId,
      },
      update: {},
    });

    await grantCourseBonusWithClient(tx, order.userId, order.id);

    return { newlyFulfilled: true };
  });

  if (!result.newlyFulfilled) {
    logDebug("[fulfillOrder] Already fulfilled during transaction", { orderId });
    return true;
  }

  logDebug("[fulfillOrder] Completed", {
    orderId,
    courseBonusCredits: COURSE_BONUS_CREDITS,
  });

  sendPurchaseEmail(
    order.user.email,
    order.user.name ?? "მომხმარებელი",
    order.course.title,
    String(order.amount)
  ).catch((err) => console.error("[Email] Purchase email failed:", err));

  return true;
}
