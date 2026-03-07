export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AdminStudentsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

const studentDateFormatter = new Intl.DateTimeFormat("ka-GE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function getInitials(name: string | null, email: string) {
  if (!name) {
    return email.slice(0, 2).toUpperCase();
  }

  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStudentStatus(student: {
  createdAt: Date;
  _count: { enrollments: number };
}) {
  if (student._count.enrollments > 0) {
    return {
      label: "აქტიური",
      className: "border-brand-success/20 bg-brand-success/10 text-brand-success",
    };
  }

  const daysSinceRegistration = Math.floor(
    (Date.now() - student.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceRegistration <= 7) {
    return {
      label: "ახალი",
      className: "border-brand-primary/20 bg-brand-primary-light text-brand-primary",
    };
  }

  return {
    label: "რეგისტრირებული",
    className: "border-brand-border bg-brand-surface-light text-brand-muted",
  };
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
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  });
}

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const students = await getStudents(query);
  const hasQuery = Boolean(query);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-secondary">
            სტუდენტები
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            სტუდენტების სია, რეგისტრაციის სტატუსი და კურსების აქტივობა
          </p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-muted">
          სულ {students.length} სტუდენტი
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        <form className="grid gap-3 border-b border-brand-border p-4 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="მოძებნე სტუდენტი სახელით ან ელფოსტით..."
              className="h-11 rounded-xl pl-9"
              aria-label="სტუდენტის ძიება"
            />
          </div>
          <Button type="submit" className="h-11 rounded-xl">
            ძიება
          </Button>
          {hasQuery ? (
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/admin/students">გასუფთავება</Link>
            </Button>
          ) : (
            <div />
          )}
        </form>

        {students.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary-light">
              <Users className="size-6 text-brand-primary" />
            </div>
            <h2 className="mt-4 text-balance font-display text-xl font-bold text-brand-secondary">
              სტუდენტები ვერ მოიძებნა
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-brand-muted">
              {hasQuery
                ? "შეცვალე საძიებო ტექსტი და სცადე თავიდან."
                : "რეგისტრირებული სტუდენტები აქ გამოჩნდება."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-brand-border">
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  სტუდენტი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  რეგისტრაცია
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  კურსები
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  შეფასებები
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  სტატუსი
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const status = getStudentStatus(student);

                return (
                  <TableRow key={student.id} className="border-brand-border">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={student.avatarUrl ?? undefined}
                            alt={student.name ?? student.email}
                          />
                          <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                            {getInitials(student.name, student.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-brand-secondary">
                            {student.name ?? "უსახელო სტუდენტი"}
                          </p>
                          <p className="truncate text-xs text-brand-muted">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-sm tabular-nums text-brand-muted">
                      {studentDateFormatter.format(student.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 font-medium text-brand-secondary">
                      {student._count.enrollments.toLocaleString("ka-GE")}
                    </TableCell>
                    <TableCell className="px-4 font-medium text-brand-secondary">
                      {student._count.reviews.toLocaleString("ka-GE")}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
