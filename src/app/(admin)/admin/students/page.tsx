export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatKaShortDate } from "@/lib/format";
import { StudentsTable } from "@/components/admin/StudentsTable";

interface AdminStudentsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

async function getStudents(query: string) {
  return prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      creditBalance: {
        select: { balance: true },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  });
}

function getStudentStatusSnapshot(student: { createdAt: Date; enrollments: number }) {
  if (student.enrollments > 0) {
    return "active" as const;
  }

  const daysSinceRegistration = Math.floor(
    (Date.now() - student.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceRegistration <= 7) {
    return "new" as const;
  }

  return "registered" as const;
}

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const students = await getStudents(query);

  const serialized = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    avatarUrl: s.avatarUrl,
    createdAt: s.createdAt.toISOString(),
    createdAtLabel: formatKaShortDate(s.createdAt),
    balance: s.creditBalance?.balance ?? 0,
    enrollments: s._count.enrollments,
    reviews: s._count.reviews,
    statusKey: getStudentStatusSnapshot({
      createdAt: s.createdAt,
      enrollments: s._count.enrollments,
    }),
  }));

  return <StudentsTable students={serialized} query={query} />;
}
