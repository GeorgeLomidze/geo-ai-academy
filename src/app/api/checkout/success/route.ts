import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/constants";
import { fulfillOrder } from "@/lib/flitt/fulfill";
import { logDebug } from "@/lib/logger";

export async function POST(request: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("[Checkout success] Failed to read body:", error);
  }

  let params: Record<string, string> = {};

  if (rawBody) {
    try {
      params = JSON.parse(rawBody);
      logDebug("[Checkout success] Parsed JSON payload");
    } catch {
      try {
        const searchParams = new URLSearchParams(rawBody);
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
        logDebug("[Checkout success] Parsed form payload");
      } catch (error) {
        console.error("[Checkout success] Failed to parse body:", error);
      }
    }
  }

  const orderId = params.order_id ?? "";
  const orderStatus = params.order_status ?? "";
  const flittPaymentId = params.payment_id ?? "";

  if (orderId && orderStatus === "approved") {
    try {
      await fulfillOrder(orderId, flittPaymentId || undefined);
    } catch (error) {
      console.error("[Checkout success] fulfillOrder failed:", error);
    }
  }

  const url = new URL("/checkout/success", siteConfig.url);
  if (orderId) {
    url.searchParams.set("order_id", orderId);
  }

  return NextResponse.redirect(url.toString(), 302);
}
