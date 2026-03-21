"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Users, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatInteger } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditEditModal } from "@/components/admin/CreditEditModal";
import { BulkCreditModal } from "@/components/admin/BulkCreditModal";

type Student = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  createdAtLabel: string;
  balance: number;
  enrollments: number;
  reviews: number;
  statusKey: "active" | "new" | "registered";
};

function getInitials(name: string | null, email: string) {
  if (!name) return email.slice(0, 2).toUpperCase();
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStudentStatus(statusKey: Student["statusKey"]) {
  switch (statusKey) {
    case "active":
      return {
        label: "აქტიური",
        className: "border-brand-success/20 bg-brand-success/10 text-brand-success",
      };
    case "new":
      return {
        label: "ახალი",
        className: "border-brand-primary/20 bg-brand-primary-light text-brand-primary",
      };
    default:
      return {
        label: "რეგისტრირებული",
        className: "border-brand-border bg-brand-surface-light text-brand-muted",
      };
  }
}

interface StudentsTableProps {
  students: Student[];
  query: string;
}

export function StudentsTable({ students, query }: StudentsTableProps) {
  const router = useRouter();
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const hasQuery = Boolean(query);

  function handleSaved() {
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-secondary">
            სტუდენტები
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            სტუდენტების სია, რეგისტრაციის სტატუსი და კრედიტების მართვა
          </p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-muted">
          სულ {students.length} სტუდენტი
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        <form className="grid gap-3 border-b border-brand-border p-4 sm:grid-cols-[1fr_auto_auto_auto]">
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
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => setBulkOpen(true)}
          >
            <Coins className="size-4" />
            ყველასთვის კრედიტების დამატება
          </Button>
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
          <div className="overflow-x-auto">
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
                  <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                    კრედიტები
                  </TableHead>
                  <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                    მოქმედება
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const status = getStudentStatus(student.statusKey);

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
                        {student.createdAtLabel}
                      </TableCell>
                      <TableCell className="px-4 font-medium text-brand-secondary">
                        {formatInteger(student.enrollments)}
                      </TableCell>
                      <TableCell className="px-4 font-medium text-brand-secondary">
                        {formatInteger(student.reviews)}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        <span
                          className={`font-medium tabular-nums ${
                            student.balance > 0
                              ? "text-brand-accent"
                              : "text-brand-muted"
                          }`}
                        >
                          ✦ {formatInteger(student.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => setEditUserId(student.id)}
                        >
                          <Coins className="size-3.5" />
                          კრედიტების დამატება
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreditEditModal
        userId={editUserId}
        open={editUserId !== null}
        onClose={() => setEditUserId(null)}
        onSaved={handleSaved}
      />

      <BulkCreditModal
        open={bulkOpen}
        studentCount={students.length}
        onClose={() => setBulkOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
