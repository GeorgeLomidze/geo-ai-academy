import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/constants";
import { failCreditPurchase, fulfillCreditPurchase } from "@/lib/credits/purchases";
import { logDebug } from "@/lib/logger";

const AI_TOOLS_PATH = "/ai-tools";

export async function POST(request: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("[Credit purchase success] Failed to read body:", error);
  }

  let params: Record<string, string> = {};

  if (rawBody) {
    try {
      params = JSON.parse(rawBody) as Record<string, string>;
      logDebug("[Credit purchase success] Parsed JSON payload");
    } catch {
      try {
        const searchParams = new URLSearchParams(rawBody);
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
        logDebug("[Credit purchase success] Parsed form payload");
      } catch (error) {
        console.error("[Credit purchase success] Failed to parse body:", error);
      }
    }
  }

  const purchaseId = params.order_id ?? "";
  const orderStatus = params.order_status ?? "";
  const paymentId = params.payment_id ?? "";
  const paymentSucceeded = purchaseId && orderStatus === "approved";

  if (paymentSucceeded) {
    try {
      await fulfillCreditPurchase(purchaseId, paymentId || undefined);
    } catch (error) {
      console.error("[Credit purchase success] fulfillCreditPurchase failed:", error);
    }
  } else if (
    purchaseId &&
    (orderStatus === "declined" || orderStatus === "expired")
  ) {
    try {
      await failCreditPurchase(purchaseId, paymentId || undefined);
    } catch (error) {
      console.error("[Credit purchase success] failCreditPurchase failed:", error);
    }
  }

  const url = new URL(AI_TOOLS_PATH, siteConfig.url);
  if (paymentSucceeded) {
    url.searchParams.set("credits", "success");
  } else if (purchaseId) {
    url.searchParams.set("credits", "failed");
  }

  return NextResponse.redirect(url.toString(), 302);
}
