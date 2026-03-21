import {
  Prisma,
  PrismaClient,
  type CreditTransaction,
  type CreditTransactionType,
} from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

const INSUFFICIENT_CREDITS_MESSAGE = "კრედიტები არ არის საკმარისი";

export const COURSE_BONUS_CREDITS = 2000;

type CreditDbClient = PrismaClient | Prisma.TransactionClient;
type CreditAdditionType =
  | "PURCHASE"
  | "BONUS"
  | "REFUND"
  | "COURSE_BONUS";

type CreditAdditionOptions = {
  generationId?: string;
  modelUsed?: string;
  purchaseId?: string;
};

type LockedBalanceRow = {
  id: string;
  balance: number;
};

type CreditMutationResult = {
  balance: number;
  transaction: CreditTransaction;
};

function assertValidAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Credit amount must be a positive integer.");
  }
}

async function ensureBalanceRecord(client: CreditDbClient, userId: string) {
  return client.creditBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
}

async function lockBalanceRecord(client: CreditDbClient, userId: string) {
  const rows = await client.$queryRaw<LockedBalanceRow[]>(Prisma.sql`
    SELECT id, balance
    FROM "credit_balances"
    WHERE "userId" = ${userId}
    FOR UPDATE
  `);

  const row = rows[0];

  if (!row) {
    throw new Error(`Credit balance was not found for user ${userId}.`);
  }

  return row;
}

async function recordCreditChange(
  client: CreditDbClient,
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  options?: {
    modelUsed?: string;
    generationId?: string;
    purchaseId?: string;
  }
): Promise<CreditMutationResult> {
  assertValidAmount(amount);

  await ensureBalanceRecord(client, userId);
  const lockedBalance = await lockBalanceRecord(client, userId);
  const nextBalance =
    type === "USAGE"
      ? lockedBalance.balance - amount
      : lockedBalance.balance + amount;

  if (nextBalance < 0) {
    throw new ApiError(400, INSUFFICIENT_CREDITS_MESSAGE);
  }

  await client.creditBalance.update({
    where: { id: lockedBalance.id },
    data: { balance: nextBalance },
  });

  const transactionAmount =
    type === "USAGE" ? -amount : amount;

  const transaction = await client.creditTransaction.create({
    data: {
      userId,
      balanceId: lockedBalance.id,
      amount: transactionAmount,
      balanceBefore: lockedBalance.balance,
      balanceAfter: nextBalance,
      type,
      description,
      modelUsed: options?.modelUsed ?? null,
      generationId: options?.generationId ?? null,
      purchaseId: options?.purchaseId ?? null,
    },
  });

  return {
    balance: nextBalance,
    transaction,
  };
}

async function runCreditMutation(
  action: (client: Prisma.TransactionClient) => Promise<CreditMutationResult>
) {
  return prisma.$transaction(action, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

export async function ensureCreditBalance(userId: string) {
  return prisma.creditBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getBalance(userId: string) {
  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
    select: { balance: true },
  });

  return balance?.balance ?? 0;
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  modelUsed?: string,
  generationId?: string
) {
  return runCreditMutation((client) =>
    recordCreditChange(
      client,
      userId,
      amount,
      "USAGE",
      description,
      {
        modelUsed,
        generationId,
      }
    )
  );
}

export async function deductCreditsWithClient(
  client: CreditDbClient,
  userId: string,
  amount: number,
  description: string,
  modelUsed?: string,
  generationId?: string
) {
  return recordCreditChange(
    client,
    userId,
    amount,
    "USAGE",
    description,
    {
      modelUsed,
      generationId,
    }
  );
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditAdditionType,
  description: string,
  options?: CreditAdditionOptions
) {
  return runCreditMutation((client) =>
    recordCreditChange(
      client,
      userId,
      amount,
      type as CreditTransactionType,
      description,
      {
        generationId: options?.generationId,
        modelUsed: options?.modelUsed,
        purchaseId: options?.purchaseId,
      }
    )
  );
}

export async function addCreditsWithClient(
  client: CreditDbClient,
  userId: string,
  amount: number,
  type: CreditAdditionType,
  description: string,
  options?: CreditAdditionOptions
) {
  return recordCreditChange(
    client,
    userId,
    amount,
    type as CreditTransactionType,
    description,
    {
      generationId: options?.generationId,
      modelUsed: options?.modelUsed,
      purchaseId: options?.purchaseId,
    }
  );
}

export async function hasEnoughCredits(userId: string, amount: number) {
  if (amount <= 0) {
    return true;
  }

  return (await getBalance(userId)) >= amount;
}

export async function grantCourseBonusWithClient(
  client: CreditDbClient,
  userId: string,
  orderId: string
) {
  return addCreditsWithClient(
    client,
    userId,
    COURSE_BONUS_CREDITS,
    "COURSE_BONUS",
    "კურსის შეძენის ბონუსი",
    {
      purchaseId: orderId,
    }
  );
}
