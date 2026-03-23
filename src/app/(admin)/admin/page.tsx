import Link from "next/link";
import {
  Users,
  BookOpen,
  DollarSign,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KieBalanceCard } from "@/components/admin/KieBalanceCard";
import { prisma } from "@/lib/prisma";

type Trend = "up" | "down";

type ActivityItem = {
  text: string;
  time: string;
  timestamp: Date;
};

function getWindowStart(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSignedNumber(value: number) {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPercentChange(current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return { value: "0%", trend: "up" as Trend };
  }

  if (previous === 0) {
    return { value: "+100%", trend: "up" as Trend };
  }

  const rawChange = Math.round(((current - previous) / previous) * 100);
  return {
    value: `${rawChange > 0 ? "+" : ""}${rawChange}%`,
    trend: rawChange >= 0 ? ("up" as Trend) : ("down" as Trend),
  };
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) return "ახლახან";
  if (diffMinutes < 60) return `${diffMinutes} წუთის წინ`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} საათის წინ`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} დღის წინ`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} თვის წინ`;
}

function getDisplayName(user: { name: string | null; email: string }) {
  return user.name?.trim() || user.email;
}

async function getDashboardData() {
  const currentWindowStart = getWindowStart(30);
  const previousWindowStart = getWindowStart(60);

  const [
    totalStudents,
    totalPublishedCourses,
    currentRegistrations,
    previousRegistrations,
    currentPublishedCourses,
    previousPublishedCourses,
    enrollments,
    recentUsers,
    recentEnrollments,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "STUDENT" },
    }),
    prisma.course.count({
      where: { status: "PUBLISHED" },
    }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        createdAt: { gte: currentWindowStart },
      },
    }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        createdAt: { gte: previousWindowStart, lt: currentWindowStart },
      },
    }),
    prisma.course.count({
      where: {
        status: "PUBLISHED",
        createdAt: { gte: currentWindowStart },
      },
    }),
    prisma.course.count({
      where: {
        status: "PUBLISHED",
        createdAt: { gte: previousWindowStart, lt: currentWindowStart },
      },
    }),
    prisma.enrollment.findMany({
      select: {
        enrolledAt: true,
        course: {
          select: {
            price: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.enrollment.findMany({
      orderBy: { enrolledAt: "desc" },
      take: 5,
      select: {
        enrolledAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  const totalRevenue = enrollments.reduce(
    (sum, enrollment) => sum + enrollment.course.price,
    0
  );
  const currentRevenue = enrollments
    .filter((enrollment) => enrollment.enrolledAt >= currentWindowStart)
    .reduce((sum, enrollment) => sum + enrollment.course.price, 0);
  const previousRevenue = enrollments
    .filter(
      (enrollment) =>
        enrollment.enrolledAt >= previousWindowStart &&
        enrollment.enrolledAt < currentWindowStart
    )
    .reduce((sum, enrollment) => sum + enrollment.course.price, 0);

  const revenueChange = formatPercentChange(currentRevenue, previousRevenue);
  const registrationChange = formatPercentChange(
    currentRegistrations,
    previousRegistrations
  );

  const recentActivity: ActivityItem[] = [
    ...recentUsers.map((user) => ({
      text: `${getDisplayName(user)} დარეგისტრირდა პლატფორმაზე`,
      time: formatRelativeTime(user.createdAt),
      timestamp: user.createdAt,
    })),
    ...recentEnrollments.map((enrollment) => ({
      text: `${getDisplayName(enrollment.user)} შეიძინა კურსი "${enrollment.course.title}"`,
      time: formatRelativeTime(enrollment.enrolledAt),
      timestamp: enrollment.enrolledAt,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  return {
    stats: [
      {
        label: "სულ სტუდენტები",
        value: totalStudents.toLocaleString("ka-GE"),
        change: formatSignedNumber(currentRegistrations),
        trend: currentRegistrations >= previousRegistrations ? "up" : "down",
        helper: "ბოლო 30 დღის ახალი რეგისტრაციები",
        icon: Users,
        iconBg: "bg-brand-primary-light text-brand-primary",
      },
      {
        label: "აქტიური კურსები",
        value: totalPublishedCourses.toLocaleString("ka-GE"),
        change: formatSignedNumber(currentPublishedCourses - previousPublishedCourses),
        trend:
          currentPublishedCourses >= previousPublishedCourses ? "up" : "down",
        helper: "გამოქვეყნებული კურსები",
        icon: BookOpen,
        iconBg: "bg-brand-success/10 text-brand-success",
      },
      {
        label: "შემოსავალი",
        value: formatCurrency(totalRevenue),
        change: revenueChange.value,
        trend: revenueChange.trend,
        helper: "გათვლილია ჩარიცხვების მიხედვით",
        icon: DollarSign,
        iconBg: "bg-brand-warning/10 text-brand-warning",
      },
      {
        label: "ახალი რეგისტრაციები",
        value: currentRegistrations.toLocaleString("ka-GE"),
        change: registrationChange.value,
        trend: registrationChange.trend,
        helper: "ბოლო 30 დღე წინა 30 დღესთან შედარებით",
        icon: UserPlus,
        iconBg: "bg-brand-accent/10 text-brand-accent",
      },
    ],
    recentActivity,
    revenue: {
      total: totalRevenue,
      current: currentRevenue,
      previous: previousRevenue,
      enrollments: enrollments.length,
      currentRegistrations,
    },
  };
}

export default async function AdminOverviewPage() {
  const dashboardData = await getDashboardData();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        მიმოხილვა
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        პლატფორმის ძირითადი მაჩვენებლები
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardData.stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-brand-border bg-brand-surface p-5 transition-all duration-200 hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(255,214,10,0.1)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon className="size-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                    stat.trend === "up"
                      ? "text-brand-success"
                      : "text-brand-danger"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-brand-secondary">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-brand-muted">{stat.label}</p>
              <p className="mt-2 text-xs text-brand-muted">{stat.helper}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 max-w-xs">
        <KieBalanceCard />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-brand-secondary">
              შემოსავალი
            </h2>
            <span className="text-xs text-brand-muted">ბოლო 30 დღე</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-brand-background p-4">
              <p className="text-xs text-brand-muted">ჯამური შემოსავალი</p>
              <p className="mt-2 font-display text-2xl font-bold text-brand-secondary">
                {formatCurrency(dashboardData.revenue.total)}
              </p>
            </div>
            <div className="rounded-xl bg-brand-background p-4">
              <p className="text-xs text-brand-muted">ბოლო 30 დღის შემოსავალი</p>
              <p className="mt-2 font-display text-2xl font-bold text-brand-secondary">
                {formatCurrency(dashboardData.revenue.current)}
              </p>
            </div>
            <div className="rounded-xl bg-brand-background p-4">
              <p className="text-xs text-brand-muted">წინა 30 დღის შემოსავალი</p>
              <p className="mt-2 font-display text-2xl font-bold text-brand-secondary">
                {formatCurrency(dashboardData.revenue.previous)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 rounded-xl border border-brand-border bg-brand-background p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-brand-muted">გაყიდული კურსები სულ</p>
              <p className="mt-1 text-lg font-semibold text-brand-secondary">
                {dashboardData.revenue.enrollments.toLocaleString("ka-GE")}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-muted">ახალი რეგისტრაციები ბოლო 30 დღეში</p>
              <p className="mt-1 text-lg font-semibold text-brand-secondary">
                {dashboardData.revenue.currentRegistrations.toLocaleString("ka-GE")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-brand-secondary">
            ბოლო აქტივობა
          </h2>

          {dashboardData.recentActivity.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {dashboardData.recentActivity.map((item) => (
                <li key={`${item.text}-${item.timestamp.toISOString()}`} className="flex gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary-light">
                    <Clock className="size-3.5 text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-brand-secondary">{item.text}</p>
                    <p className="text-xs text-brand-muted">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-brand-border px-4 py-8 text-center">
              <p className="text-sm text-brand-muted">აქტივობა ჯერ არ დაფიქსირებულა</p>
              <Button asChild variant="outline" className="mt-4 rounded-xl">
                <Link href="/admin/students">სტუდენტების ნახვა</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
