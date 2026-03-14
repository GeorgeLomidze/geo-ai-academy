import { prisma } from "@/lib/prisma";
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

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        flittOrderId: orderId,
        flittPaymentId: flittPaymentId ?? undefined,
      },
    }),
    prisma.enrollment.upsert({
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
    }),
  ]);

  logDebug("[fulfillOrder] Completed", { orderId });

  sendPurchaseEmail(
    order.user.email,
    order.user.name ?? "მომხმარებელი",
    order.course.title,
    String(order.amount)
  ).catch((err) => console.error("[Email] Purchase email failed:", err));

  return true;
}
