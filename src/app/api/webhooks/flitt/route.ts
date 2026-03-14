import { NextRequest, NextResponse } from "next/server";
import {
  badRequestResponse,
  forbiddenResponse,
  handleApiError,
  serverErrorResponse,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { verifyFlittSignature } from "@/lib/flitt/client";
import { fulfillOrder } from "@/lib/flitt/fulfill";
import { logDebug } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.FLITT_SECRET_KEY;
    if (!secretKey) {
      console.error("[Flitt webhook] FLITT_SECRET_KEY not configured");
      return serverErrorResponse();
    }

    let body: Record<string, string>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse();
    }

    const { signature, ...params } = body;

    if (!signature || !verifyFlittSignature(params, signature, secretKey)) {
      return forbiddenResponse();
    }

    const orderId = params.order_id;
    const orderStatus = params.order_status;
    const flittPaymentId = params.payment_id;

    logDebug("[Flitt webhook] Valid request received", { orderId, orderStatus });

    if (!orderId || !orderStatus) {
      return badRequestResponse();
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
    return handleApiError(error, "POST /api/webhooks/flitt failed");
  }
}
