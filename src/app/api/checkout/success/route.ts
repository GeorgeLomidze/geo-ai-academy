import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/constants";

export async function POST(request: NextRequest) {
  let orderId = "";

  try {
    const formData = await request.formData();
    orderId = (formData.get("order_id") as string) ?? "";
  } catch {
    try {
      const body = await request.json();
      orderId = body.order_id ?? "";
    } catch {
      // no body — redirect anyway
    }
  }

  const url = new URL("/checkout/success", siteConfig.url);
  if (orderId) {
    url.searchParams.set("order_id", orderId);
  }

  return NextResponse.redirect(url.toString(), 302);
}
