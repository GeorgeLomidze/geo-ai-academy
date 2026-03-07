import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/constants";
import { fulfillOrder } from "@/lib/flitt/fulfill";

export async function POST(request: NextRequest) {
  console.log("[Checkout success] POST received");

  // Read body as text first — this always works regardless of content-type
  let rawBody = "";
  try {
    rawBody = await request.text();
    console.log("[Checkout success] Raw body:", rawBody);
  } catch (err) {
    console.error("[Checkout success] Failed to read body:", err);
  }

  // Parse body — could be form-urlencoded or JSON
  let params: Record<string, string> = {};

  if (rawBody) {
    try {
      // Try JSON first
      params = JSON.parse(rawBody);
      console.log("[Checkout success] Parsed as JSON");
    } catch {
      // Try form-urlencoded
      try {
        const searchParams = new URLSearchParams(rawBody);
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
        console.log("[Checkout success] Parsed as form-urlencoded");
      } catch (err) {
        console.error("[Checkout success] Failed to parse body:", err);
      }
    }
  }

  console.log("[Checkout success] Parsed params:", JSON.stringify(params));

  const orderId = params.order_id ?? "";
  const orderStatus = params.order_status ?? "";
  const flittPaymentId = params.payment_id ?? "";

  console.log("[Checkout success] order_id:", orderId);
  console.log("[Checkout success] order_status:", orderStatus);
  console.log("[Checkout success] payment_id:", flittPaymentId);

  if (orderId && orderStatus === "approved") {
    console.log("[Checkout success] Status is approved — fulfilling order");
    try {
      const result = await fulfillOrder(orderId, flittPaymentId || undefined);
      console.log("[Checkout success] fulfillOrder result:", result);
    } catch (err) {
      console.error("[Checkout success] fulfillOrder threw:", err);
    }
  } else {
    console.log("[Checkout success] Skipping fulfillment — orderId:", orderId, "orderStatus:", orderStatus);
  }

  const url = new URL("/checkout/success", siteConfig.url);
  if (orderId) {
    url.searchParams.set("order_id", orderId);
  }

  console.log("[Checkout success] Redirecting to:", url.toString());
  return NextResponse.redirect(url.toString(), 302);
}
