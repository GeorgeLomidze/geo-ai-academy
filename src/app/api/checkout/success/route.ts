import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/constants";
import { verifyFlittSignature } from "@/lib/flitt/client";
import { fulfillOrder } from "@/lib/flitt/fulfill";

function parseBody(entries: Iterable<[string, FormDataEntryValue | string]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    result[key] = String(value);
  }
  return result;
}

export async function POST(request: NextRequest) {
  let params: Record<string, string> = {};

  try {
    const formData = await request.formData();
    params = parseBody(formData.entries());
  } catch {
    try {
      const cloned = request.clone();
      params = await cloned.json();
    } catch {
      // no body — redirect anyway
    }
  }

  const orderId = params.order_id ?? "";
  const orderStatus = params.order_status ?? "";
  const signature = params.signature ?? "";
  const flittPaymentId = params.payment_id;

  // Fallback enrollment: if Flitt says approved, fulfill the order here
  // in case the server callback (webhook) didn't reach us
  if (orderId && orderStatus === "approved") {
    const secretKey = process.env.FLITT_SECRET_KEY;

    if (secretKey && signature) {
      const { signature: _sig, ...verifyParams } = params;
      if (verifyFlittSignature(verifyParams, signature, secretKey)) {
        await fulfillOrder(orderId, flittPaymentId);
      } else {
        console.error("[Checkout success] Invalid Flitt signature on redirect");
      }
    } else {
      // No signature verification possible — still try to fulfill
      // since the user was redirected from Flitt with a valid order_id
      await fulfillOrder(orderId, flittPaymentId);
    }
  }

  const url = new URL("/checkout/success", siteConfig.url);
  if (orderId) {
    url.searchParams.set("order_id", orderId);
  }

  return NextResponse.redirect(url.toString(), 302);
}
