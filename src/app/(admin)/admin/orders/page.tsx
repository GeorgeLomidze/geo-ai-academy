export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { getAdminOrders } from "@/lib/orders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface AdminOrdersPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

const dateFormatter = new Intl.DateTimeFormat("ka-GE", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusConfig = {
  PENDING: { label: "მოლოდინში", variant: "outline" as const, className: "border-yellow-500/50 text-yellow-500 bg-yellow-500/10" },
  PAID: { label: "გადახდილი", variant: "outline" as const, className: "border-green-500/50 text-green-500 bg-green-500/10" },
  FAILED: { label: "წარუმატებელი", variant: "outline" as const, className: "border-red-500/50 text-red-500 bg-red-500/10" },
  REFUNDED: { label: "დაბრუნებული", variant: "outline" as const, className: "border-blue-500/50 text-blue-500 bg-blue-500/10" },
} as const;

function getInitials(name: string | null) {
  if (!name) return "სტ";
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const orders = await getAdminOrders({ query, status });
  const hasFilters = Boolean(query || status);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-secondary">
            შეკვეთები
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            სტუდენტების შეკვეთების ისტორია და გადახდების სტატუსი
          </p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-muted">
          სულ {orders.length} ჩანაწერი
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface">
        <form className="grid gap-3 border-b border-brand-border p-4 lg:grid-cols-[1fr_180px_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="მოძებნე სტუდენტი ან კურსი..."
              className="h-11 rounded-xl pl-9"
              aria-label="შეკვეთის ძიება"
            />
          </div>

          <label className="flex items-center">
            <span className="sr-only">სტატუსის ფილტრი</span>
            <select
              name="status"
              defaultValue={status}
              className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm text-brand-secondary outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="სტატუსის ფილტრი"
            >
              <option value="">ყველა სტატუსი</option>
              <option value="PENDING">მოლოდინში</option>
              <option value="PAID">გადახდილი</option>
              <option value="FAILED">წარუმატებელი</option>
              <option value="REFUNDED">დაბრუნებული</option>
            </select>
          </label>

          <Button type="submit" className="h-11 rounded-xl">
            გაფილტვრა
          </Button>

          {hasFilters ? (
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/admin/orders">გასუფთავება</Link>
            </Button>
          ) : (
            <div />
          )}
        </form>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary-light">
              <ShoppingCart className="size-6 text-brand-primary" />
            </div>
            <h2 className="mt-4 text-balance font-display text-xl font-bold text-brand-secondary">
              შეკვეთები ვერ მოიძებნა
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-brand-muted">
              შეცვალე ძიების ტექსტი ან ფილტრი და სცადე თავიდან.
            </p>
            {hasFilters && (
              <Button asChild className="mt-5 rounded-xl">
                <Link href="/admin/orders">ფილტრების გასუფთავება</Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-brand-border">
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  თარიღი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  სტუდენტი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  კურსი
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  თანხა
                </TableHead>
                <TableHead className="px-4 text-xs font-medium uppercase text-brand-muted">
                  სტატუსი
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const config = statusConfig[order.status];
                return (
                  <TableRow key={order.id} className="border-brand-border">
                    <TableCell className="px-4 text-sm tabular-nums text-brand-muted">
                      {dateFormatter.format(order.createdAt)}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={order.user.avatarUrl ?? undefined}
                            alt={order.user.name ?? "სტუდენტი"}
                          />
                          <AvatarFallback className="bg-brand-primary-light text-brand-primary">
                            {getInitials(order.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-brand-secondary">
                            {order.user.name ?? "უსახელო სტუდენტი"}
                          </p>
                          <p className="text-xs text-brand-muted">
                            {order.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <Link
                        href={`/courses/${order.course.slug}`}
                        className="font-medium text-brand-secondary hover:text-brand-primary"
                      >
                        {order.course.title}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4">
                      <span className="font-semibold tabular-nums text-brand-secondary">
                        {Number(order.amount)} {order.currency}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        variant={config.variant}
                        className={config.className}
                      >
                        {config.label}
                      </Badge>
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
