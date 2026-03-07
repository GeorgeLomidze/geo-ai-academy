import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/constants";

export async function POST(request: NextRequest) {
  let orderId = "";

  try {
    const formData = await request.formData();
    orderId = (formData.get("order_id") as string) ?? "";
  } catch {
    try {
      const cloned = request.clone();
      const body = await cloned.json();
      orderId = body.order_id ?? "";
    } catch {
      // no body — redirect anyway
    }
  }

  if (orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (order && order.status === "PENDING") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
      }
    } catch (error) {
      console.error("[Checkout failed] Error updating order:", error);
    }
  }

  const url = new URL("/checkout/failed", siteConfig.url);
  if (orderId) {
    url.searchParams.set("order_id", orderId);
  }

  return NextResponse.redirect(url.toString(), 302);
}
