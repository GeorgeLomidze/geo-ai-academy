import Link from "next/link";
import {
  BookOpen,
  Globe,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const quickLinks = [
  {
    title: "კურსების მართვა",
    description: "დაამატე, შეცვალე ან დაარედაქტირე არსებული კურსები.",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "სტუდენტების სია",
    description: "ნახე რეგისტრირებული მომხმარებლები და მათი აქტივობა.",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "შეფასებების მოდერაცია",
    description: "გადახედე სტუდენტების შეფასებებს და საჭიროებისას მართე.",
    href: "/admin/reviews",
    icon: Sparkles,
  },
] as const;

async function getSettingsData() {
  const [studentsCount, coursesCount, adminsCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return { studentsCount, coursesCount, adminsCount };
}

export default async function AdminSettingsPage() {
  const settingsData = await getSettingsData();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        პარამეტრები
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        პლატფორმის ზოგადი ინფორმაცია და სწრაფი ადმინისტრაციული მოქმედებები
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
              <Globe className="size-5" />
            </div>
            <div>
              <h2 className="text-xl text-brand-secondary">ზოგადი ინფორმაცია</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-muted">
                ეს ბლოკი გამოიყენე ადმინისტრაციული ორიენტაციისთვის: ბრენდის
                სახელი, აპლიკაციის მისამართი და ძირითადი სტატისტიკა ერთ ადგილას.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
              <p className="text-xs uppercase text-brand-muted">პლატფორმა</p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {siteConfig.name}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
              <p className="text-xs uppercase text-brand-muted">მისამართი</p>
              <p className="mt-2 break-all text-sm font-medium text-brand-secondary">
                {siteConfig.url}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
              <p className="text-xs uppercase text-brand-muted">ადმინები</p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {settingsData.adminsCount.toLocaleString("ka-GE")}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
              <p className="text-xs uppercase text-brand-muted">სტუდენტები</p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {settingsData.studentsCount.toLocaleString("ka-GE")}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
              <p className="text-xs uppercase text-brand-muted">აქტიური კურსები</p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {settingsData.coursesCount.toLocaleString("ka-GE")}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
              <p className="text-xs uppercase text-brand-muted">როლი</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
                <Shield className="size-4" />
                ადმინისტრატორი
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <h2 className="text-xl text-brand-secondary">სწრაფი მოქმედებები</h2>
          <p className="mt-2 text-sm leading-7 text-brand-muted">
            ყველაზე ხშირად გამოყენებული ადმინისტრაციული ბმულები ერთ ბლოკში.
          </p>

          <div className="mt-6 grid gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-brand-border bg-brand-background p-4 transition-colors duration-200 hover:border-brand-primary/30 hover:bg-brand-surface-light"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-brand-secondary">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-brand-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Button asChild className="mt-6 h-11 w-full rounded-xl">
            <Link href="/admin">მიმოხილვაზე დაბრუნება</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
