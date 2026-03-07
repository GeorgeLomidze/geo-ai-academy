import { prisma } from "@/lib/prisma";

export async function fulfillOrder(
  orderId: string,
  flittPaymentId?: string,
): Promise<boolean> {
  console.log("[fulfillOrder] Starting — orderId:", orderId, "paymentId:", flittPaymentId);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, courseId: true, status: true },
  });

  console.log("[fulfillOrder] Order lookup result:", order ? JSON.stringify(order) : "NOT FOUND");

  if (!order) {
    console.error("[fulfillOrder] Order not found:", orderId);
    return false;
  }

  if (order.status === "PAID") {
    console.log("[fulfillOrder] Order already PAID, skipping");
    return true;
  }

  console.log("[fulfillOrder] Updating order to PAID and creating enrollment for user:", order.userId, "course:", order.courseId);

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

  console.log("[fulfillOrder] Transaction complete — order PAID, enrollment created");
  return true;
}
