import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma, type CreditTransactionType } from "@prisma/client";
import {
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
  getSafeZodFieldErrors,
} from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const bulkGrantSchema = z.object({
  amount: z.number().int().positive("რაოდენობა უნდა იყოს დადებითი რიცხვი"),
  reason: z.string().min(1, "მიზეზი სავალდებულოა"),
  note: z.string().optional(),
});

const ADMIN_GRANT_TYPE = "ADMIN_GRANT" as CreditTransactionType;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const parsed = bulkGrantSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(getSafeZodFieldErrors(parsed.error));
    }

    const { amount, reason, note } = parsed.data;

    const admin = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, email: true },
    });
    const adminName = admin?.name ?? admin?.email ?? "ადმინი";
    const description = `ბალკ დამატება: ${reason}${note ? ` — ${note}` : ""} (${adminName})`;

    // Get all students
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    });

    // Ensure all students have balance records
    await prisma.$transaction(
      students.map((s) =>
        prisma.creditBalance.upsert({
          where: { userId: s.id },
          update: {},
          create: { userId: s.id },
          select: { id: true },
        })
      )
    );

    // Process each student in a serializable transaction
    let affected = 0;

    for (const student of students) {
      await prisma.$transaction(
        async (client) => {
          const rows = await client.$queryRaw<{ id: string; balance: number }[]>(
            Prisma.sql`
              SELECT id, balance
              FROM "credit_balances"
              WHERE "userId" = ${student.id}
              FOR UPDATE
            `
          );

          const row = rows[0];
          if (!row) return;

          const nextBalance = row.balance + amount;

          await client.creditBalance.update({
            where: { id: row.id },
            data: { balance: nextBalance },
          });

          await client.creditTransaction.create({
            data: {
              userId: student.id,
              balanceId: row.id,
              amount,
              balanceBefore: row.balance,
              balanceAfter: nextBalance,
              type: ADMIN_GRANT_TYPE,
              description,
            },
          });

          affected++;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    }

    return NextResponse.json({
      success: true,
      affected,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/credits/bulk failed");
  }
}
