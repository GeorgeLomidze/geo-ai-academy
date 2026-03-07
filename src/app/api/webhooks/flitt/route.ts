import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFlittSignature } from "@/lib/flitt/client";

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.FLITT_SECRET_KEY;
    if (!secretKey) {
      console.error("FLITT_SECRET_KEY not configured");
      return NextResponse.json({ status: "error" }, { status: 500 });
    }

    let body: Record<string, string>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ status: "error" }, { status: 400 });
    }

    const { signature, ...params } = body;

    if (!signature || !verifyFlittSignature(params, signature, secretKey)) {
      console.error("Invalid Flitt webhook signature");
      return NextResponse.json({ status: "error" }, { status: 403 });
    }

    const orderId = params.order_id;
    const orderStatus = params.order_status;
    const flittPaymentId = params.payment_id;

    if (!orderId || !orderStatus) {
      return NextResponse.json({ status: "error" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, courseId: true, status: true },
    });

    if (!order) {
      console.error(`Flitt webhook: order not found — ${orderId}`);
      return NextResponse.json({ status: "ok" });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ status: "ok" });
    }

    if (orderStatus === "approved") {
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
    } else if (orderStatus === "declined" || orderStatus === "expired") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          flittPaymentId: flittPaymentId ?? undefined,
        },
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Flitt webhook error", error);
    return NextResponse.json({ status: "ok" });
  }
}
