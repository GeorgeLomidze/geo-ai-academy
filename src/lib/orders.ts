import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

interface GetAdminOrdersParams {
  query: string;
  status: string;
}

export async function getAdminOrders({ query, status }: GetAdminOrdersParams) {
  const where: Record<string, unknown> = {};

  if (status && ["PENDING", "PAID", "FAILED", "REFUNDED"].includes(status)) {
    where.status = status as OrderStatus;
  }

  if (query) {
    where.OR = [
      { user: { name: { contains: query, mode: "insensitive" } } },
      { user: { email: { contains: query, mode: "insensitive" } } },
      { course: { title: { contains: query, mode: "insensitive" } } },
    ];
  }

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, avatarUrl: true } },
      course: { select: { title: true, slug: true } },
    },
    take: 100,
  });
}
