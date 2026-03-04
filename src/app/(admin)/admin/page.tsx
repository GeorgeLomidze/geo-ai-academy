import {
  Users,
  BookOpen,
  DollarSign,
  UserPlus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
} from "lucide-react";

const stats = [
  {
    label: "სულ სტუდენტები",
    value: "1,247",
    change: "+12%",
    trend: "up" as const,
    icon: Users,
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    label: "აქტიური კურსები",
    value: "8",
    change: "+2",
    trend: "up" as const,
    icon: BookOpen,
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    label: "შემოსავალი",
    value: "₾ 24,530",
    change: "+18%",
    trend: "up" as const,
    icon: DollarSign,
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    label: "ახალი რეგისტრაციები",
    value: "56",
    change: "-3%",
    trend: "down" as const,
    icon: UserPlus,
    iconBg: "bg-amber-100 text-amber-600",
  },
] as const;

const recentActivity = [
  { text: "ნინო კ. დარეგისტრირდა პლატფორმაზე", time: "5 წუთის წინ" },
  { text: 'გიორგი მ. შეიძინა კურსი "AI Content Creation"', time: "23 წუთის წინ" },
  { text: "მარიამ ბ. დაასრულა მე-3 მოდული", time: "1 საათის წინ" },
  { text: 'ლუკა ჯ. შეიძინა კურსი "Prompt Engineering"', time: "2 საათის წინ" },
  { text: "ანა წ. დარეგისტრირდა პლატფორმაზე", time: "3 საათის წინ" },
] as const;

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        მიმოხილვა
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        პლატფორმის ძირითადი მაჩვენებლები
      </p>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-brand-border bg-brand-surface p-5"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon className="size-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                    stat.trend === "up"
                      ? "text-emerald-600"
                      : "text-red-500"
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
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Chart placeholder */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-brand-secondary">
              შემოსავალი
            </h2>
            <span className="text-xs text-brand-muted">ბოლო 30 დღე</span>
          </div>
          <div className="mt-6 flex h-52 items-center justify-center rounded-xl border border-dashed border-brand-border">
            <div className="text-center">
              <BarChart3 className="mx-auto size-10 text-brand-muted/40" />
              <p className="mt-2 text-sm text-brand-muted">
                გრაფიკი მალე დაემატება
              </p>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-brand-secondary">
            ბოლო აქტივობა
          </h2>
          <ul className="mt-4 space-y-4">
            {recentActivity.map((item, i) => (
              <li key={i} className="flex gap-3">
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
        </div>
      </div>
    </div>
  );
}
