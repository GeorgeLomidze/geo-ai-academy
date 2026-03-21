import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma, type CreditTransactionType } from "@prisma/client";
import {
  handleApiError,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
  getSafeZodFieldErrors,
  badRequestResponse,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

interface AdminCreditRouteContext {
  params: Promise<{ userId: string }>;
}

const adjustmentSchema = z.object({
  amount: z.number().int().positive("რაოდენობა უნდა იყოს დადებითი რიცხვი"),
  type: z.enum(["ADMIN_GRANT", "ADMIN_DEDUCT"]),
  reason: z.string().min(1, "მიზეზი სავალდებულოა"),
  note: z.string().optional(),
});

const setBalanceSchema = z.object({
  newBalance: z.number().int().min(0, "ბალანსი არ შეიძლება იყოს უარყოფითი"),
});

export async function GET(
  request: NextRequest,
  context: AdminCreditRouteContext
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { userId } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        creditBalance: {
          select: { balance: true },
        },
      },
    });

    if (!user) return notFoundResponse();

    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        type: true,
        description: true,
        modelUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        balance: user.creditBalance?.balance ?? 0,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        type: t.type,
        description: t.description,
        modelUsed: t.modelUsed,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/credits/[userId] failed");
  }
}

export async function POST(
  request: NextRequest,
  context: AdminCreditRouteContext
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { userId } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = adjustmentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(getSafeZodFieldErrors(parsed.error));
    }

    const { amount, type, reason, note } = parsed.data;
    const transactionType = type as CreditTransactionType;

    // Get admin name for audit
    const admin = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, email: true },
    });
    const adminName = admin?.name ?? admin?.email ?? "ადმინი";

    const description = `${type === "ADMIN_GRANT" ? "დამატება" : "ჩამოჭრა"}: ${reason}${note ? ` — ${note}` : ""} (${adminName})`;

    const result = await prisma.$transaction(
      async (client) => {
        // Ensure balance record exists
        await client.creditBalance.upsert({
          where: { userId },
          update: {},
          create: { userId },
          select: { id: true },
        });

        // Lock and get current balance
        const rows = await client.$queryRaw<{ id: string; balance: number }[]>(
          Prisma.sql`
            SELECT id, balance
            FROM "credit_balances"
            WHERE "userId" = ${userId}
            FOR UPDATE
          `
        );

        const row = rows[0];
        if (!row) return null;

        const isDeduct = type === "ADMIN_DEDUCT";
        const nextBalance = isDeduct ? row.balance - amount : row.balance + amount;

        if (nextBalance < 0) {
          return { error: "ბალანსი არ შეიძლება იყოს უარყოფითი" };
        }

        await client.creditBalance.update({
          where: { id: row.id },
          data: { balance: nextBalance },
        });

        const transaction = await client.creditTransaction.create({
          data: {
            userId,
            balanceId: row.id,
            amount: isDeduct ? -amount : amount,
            balanceBefore: row.balance,
            balanceAfter: nextBalance,
            type: transactionType,
            description,
          },
        });

        return { balance: nextBalance, transaction };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (!result) return notFoundResponse();
    if ("error" in result) return badRequestResponse();

    return NextResponse.json({
      success: true,
      balance: result.balance,
      transactionId: result.transaction.id,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/credits/[userId] failed");
  }
}

export async function PUT(
  request: NextRequest,
  context: AdminCreditRouteContext
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { userId } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = setBalanceSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(getSafeZodFieldErrors(parsed.error));
    }

    const { newBalance } = parsed.data;

    const admin = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, email: true },
    });
    const adminName = admin?.name ?? admin?.email ?? "ადმინი";

    const result = await prisma.$transaction(
      async (client) => {
        await client.creditBalance.upsert({
          where: { userId },
          update: {},
          create: { userId },
          select: { id: true },
        });

        const rows = await client.$queryRaw<{ id: string; balance: number }[]>(
          Prisma.sql`
            SELECT id, balance
            FROM "credit_balances"
            WHERE "userId" = ${userId}
            FOR UPDATE
          `
        );

        const row = rows[0];
        if (!row) return null;

        const diff = newBalance - row.balance;
        if (diff === 0) return { balance: row.balance, noChange: true };

        const type = (diff > 0 ? "ADMIN_GRANT" : "ADMIN_DEDUCT") as CreditTransactionType;
        const description = `ბალანსის პირდაპირი დაყენება: ${row.balance} → ${newBalance} (${adminName})`;

        await client.creditBalance.update({
          where: { id: row.id },
          data: { balance: newBalance },
        });

        const transaction = await client.creditTransaction.create({
          data: {
            userId,
            balanceId: row.id,
            amount: diff,
            balanceBefore: row.balance,
            balanceAfter: newBalance,
            type,
            description,
          },
        });

        return { balance: newBalance, transaction };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (!result) return notFoundResponse();

    return NextResponse.json({
      success: true,
      balance: result.balance,
    });
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/credits/[userId] failed");
  }
}
