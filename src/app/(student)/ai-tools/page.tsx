import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/credits/manager";
import { CreditDisplay } from "@/components/ai/CreditDisplay";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "AI ინსტრუმენტები - GEO AI Academy",
};

interface AIToolsHubPageProps {
  searchParams?: Promise<{
    credits?: string;
  }>;
}

export default async function AIToolsHubPage({
  searchParams,
}: AIToolsHubPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const balance = await getBalance(user.id);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const creditPurchaseState = resolvedSearchParams?.credits;

  return (
    <div className="mx-auto max-w-6xl">
      <CreditDisplay balance={balance} />

      {creditPurchaseState === "success" ? (
        <div className="mt-4 rounded-[24px] border border-brand-primary/20 bg-brand-primary-light px-5 py-4 text-sm text-brand-primary">
          კოინები წარმატებით დაემატა შენს ანგარიშს.
        </div>
      ) : null}

      {creditPurchaseState === "failed" ? (
        <div className="mt-4 rounded-[24px] border border-brand-danger/20 bg-brand-danger/10 px-5 py-4 text-sm text-brand-danger">
          გადახდა ვერ დადასტურდა. გთხოვთ სცადოთ თავიდან.
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-brand-border bg-brand-surface p-6 text-center sm:p-8">
          <span className="text-6xl leading-none" aria-hidden="true">📷</span>
          <h2 className="mt-8 text-3xl text-brand-secondary">სურათის გენერაცია</h2>
          <div className="mt-8">
            <Button
              asChild
              className="rounded-full bg-brand-accent px-5 text-black hover:bg-brand-accent-hover"
            >
              <Link href="/ai-tools/image">გენერატორის გახსნა</Link>
            </Button>
          </div>
        </section>

        <section className="flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-brand-border bg-brand-surface p-6 text-center sm:p-8">
          <span className="text-6xl leading-none" aria-hidden="true">🎥</span>
          <h2 className="mt-8 text-3xl text-brand-secondary">ვიდეოს გენერაცია</h2>
          <div className="mt-8">
            <Button
              asChild
              className="rounded-full bg-brand-accent px-5 text-black hover:bg-brand-accent-hover"
            >
              <Link href="/ai-tools/video">გენერატორის გახსნა</Link>
            </Button>
          </div>
        </section>

        <section className="relative flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-brand-border bg-brand-surface p-6 text-center sm:p-8">
          <span className="absolute right-4 top-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            მალე
          </span>
          <span className="text-6xl leading-none" aria-hidden="true">🎵</span>
          <h2 className="mt-8 text-3xl text-brand-secondary">აუდიო გენერაცია</h2>
          <p className="mt-3 text-sm text-brand-muted">
            მუსიკის და აუდიო ეფექტების გენერაცია
          </p>
          <div className="mt-8">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-brand-border px-5"
            >
              <Link href="/ai-tools/audio">გვერდის ნახვა</Link>
            </Button>
          </div>
        </section>

        <section className="flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-brand-border bg-brand-surface p-6 text-center sm:p-8">
          <span className="text-6xl leading-none" aria-hidden="true">📁</span>
          <h2 className="mt-8 text-3xl text-brand-secondary">პროექტები</h2>
          <p className="mt-3 text-sm text-brand-muted">
            AI პროექტების ნოდ-ედიტორი
          </p>
          <div className="mt-8">
            <Button
              asChild
              className="rounded-full bg-brand-accent px-5 text-black hover:bg-brand-accent-hover"
            >
              <Link href="/ai-tools/projects">პროექტების გახსნა</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
