import { prisma } from "@/lib/prisma";

export async function fulfillOrder(
  orderId: string,
  flittPaymentId?: string,
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, courseId: true, status: true },
  });

  if (!order) {
    console.error("[fulfillOrder] Order not found:", orderId);
    return false;
  }

  if (order.status === "PAID") {
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

  console.log("[fulfillOrder] Order fulfilled:", orderId, "user:", order.userId);
  return true;
}
