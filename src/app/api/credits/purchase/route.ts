import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  ApiError,
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { getCreditPackage } from "@/lib/credits/packages";
import { createCheckoutUrl } from "@/lib/flitt/client";
import { siteConfig } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const purchaseSchema = z.object({
  packageId: z.enum(["starter", "standard", "premium"], "პაკეტი არასწორია"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const body = await parseJsonBody(request);
    const parsed = purchaseSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse({
        packageId: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია",
      });
    }

    const creditPackage = getCreditPackage(parsed.data.packageId);
    if (!creditPackage) {
      throw new ApiError(400, "კრედიტების პაკეტი ვერ მოიძებნა");
    }

    const purchase = await prisma.creditPurchase.create({
      data: {
        userId: auth.userId,
        coins: creditPackage.coins,
        bonusCoins: creditPackage.bonusCoins,
        amount: creditPackage.amount,
        currency: creditPackage.currency,
        status: "PENDING",
        provider: "FLITT",
      },
      select: { id: true },
    });

    const { checkoutUrl, paymentId } = await createCheckoutUrl({
      orderId: purchase.id,
      amount: creditPackage.amount,
      currency: creditPackage.currency,
      description: `GEO AI Academy - ${creditPackage.name} კოინების პაკეტი`,
      callbackUrl: `${siteConfig.url}/api/webhooks/flitt`,
      responseUrl: `${siteConfig.url}/api/credits/purchase/success`,
    });

    await prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: {
        providerOrderId: purchase.id,
        providerPaymentId: paymentId || undefined,
      },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return handleApiError(error, "POST /api/credits/purchase failed");
  }
}
