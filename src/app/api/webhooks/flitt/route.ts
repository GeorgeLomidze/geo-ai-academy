import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFlittSignature } from "@/lib/flitt/client";
import { fulfillOrder } from "@/lib/flitt/fulfill";

export async function POST(request: NextRequest) {
  console.log("[Flitt webhook] Received request");

  try {
    const secretKey = process.env.FLITT_SECRET_KEY;
    if (!secretKey) {
      console.error("[Flitt webhook] FLITT_SECRET_KEY not configured");
      return NextResponse.json({ status: "error" }, { status: 500 });
    }

    let body: Record<string, string>;
    try {
      body = await request.json();
    } catch {
      console.error("[Flitt webhook] Failed to parse JSON body");
      return NextResponse.json({ status: "error" }, { status: 400 });
    }

    console.log("[Flitt webhook] Body:", JSON.stringify(body));

    const { signature, ...params } = body;

    if (!signature || !verifyFlittSignature(params, signature, secretKey)) {
      console.error("[Flitt webhook] Invalid signature");
      return NextResponse.json({ status: "error" }, { status: 403 });
    }

    const orderId = params.order_id;
    const orderStatus = params.order_status;
    const flittPaymentId = params.payment_id;

    console.log("[Flitt webhook] order_id:", orderId, "order_status:", orderStatus);

    if (!orderId || !orderStatus) {
      return NextResponse.json({ status: "error" }, { status: 400 });
    }

    if (orderStatus === "approved") {
      await fulfillOrder(orderId, flittPaymentId);
    } else if (orderStatus === "declined" || orderStatus === "expired") {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (order && order.status !== "PAID") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "FAILED",
            flittPaymentId: flittPaymentId ?? undefined,
          },
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Flitt webhook] Error:", error);
    return NextResponse.json({ status: "ok" });
  }
}
