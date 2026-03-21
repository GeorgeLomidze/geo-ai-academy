import { prisma } from "@/lib/prisma";
import { addCreditsWithClient } from "@/lib/credits/manager";

export async function fulfillCreditPurchase(
  purchaseId: string,
  providerPaymentId?: string
) {
  const purchase = await prisma.creditPurchase.findUnique({
    where: { id: purchaseId },
    select: {
      id: true,
      userId: true,
      coins: true,
      bonusCoins: true,
      status: true,
    },
  });

  if (!purchase) {
    return false;
  }

  if (purchase.status === "COMPLETED") {
    return true;
  }

  const totalCoins = purchase.coins + purchase.bonusCoins;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.creditPurchase.updateMany({
      where: {
        id: purchase.id,
        status: {
          not: "COMPLETED",
        },
      },
      data: {
        status: "COMPLETED",
        providerPaymentId: providerPaymentId ?? undefined,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    await addCreditsWithClient(
      tx,
      purchase.userId,
      totalCoins,
      "PURCHASE",
      "კოინების პაკეტის შეძენა",
      {
        purchaseId: purchase.id,
      }
    );

    return true;
  });

  return result;
}

export async function failCreditPurchase(
  purchaseId: string,
  providerPaymentId?: string
) {
  const purchase = await prisma.creditPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, status: true },
  });

  if (!purchase || purchase.status === "COMPLETED") {
    return false;
  }

  await prisma.creditPurchase.update({
    where: { id: purchase.id },
    data: {
      status: "FAILED",
      providerPaymentId: providerPaymentId ?? undefined,
    },
  });

  return true;
}
