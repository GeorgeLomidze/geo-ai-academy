import {
  AudioWaveform,
  Clapperboard,
  FolderKanban,
  ImagePlus,
} from "lucide-react";
import { redirect } from "next/navigation";
import { ToolFeatureCard } from "@/components/ai/ToolFeatureCard";
import { createClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/credits/manager";
import { CreditDisplay } from "@/components/ai/CreditDisplay";

export const metadata = {
  title: "AI ინსტრუმენტები - GEO AI Academy",
};

interface AIToolsHubPageProps {
  searchParams?: Promise<{
    credits?: string;
  }>;
}

type ToolCardConfig = {
  title: string;
  href: string;
  ctaLabel: string;
  icon: typeof ImagePlus;
  iconTone: string;
  available: boolean;
  badge?: string;
};

const toolCards: ToolCardConfig[] = [
  {
    title: "სურათის გენერაცია",
    href: "/ai-tools/image",
    ctaLabel: "გენერატორის გახსნა",
    icon: ImagePlus,
    iconTone: "text-brand-accent",
    available: true,
  },
  {
    title: "ვიდეოს გენერაცია",
    href: "/ai-tools/video",
    ctaLabel: "გენერატორის გახსნა",
    icon: Clapperboard,
    iconTone: "text-brand-primary",
    available: true,
  },
  {
    title: "აუდიო გენერაცია",
    href: "/ai-tools/audio",
    ctaLabel: "გვერდის ნახვა",
    icon: AudioWaveform,
    iconTone: "text-brand-accent",
    available: false,
    badge: "მალე",
  },
  {
    title: "პროექტები",
    href: "/ai-tools/projects",
    ctaLabel: "პროექტების გახსნა",
    icon: FolderKanban,
    iconTone: "text-brand-primary",
    available: true,
  },
];

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

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {toolCards.map((card, index) => (
          <ToolFeatureCard
            key={card.title}
            title={card.title}
            href={card.href}
            ctaLabel={card.ctaLabel}
            icon={card.icon}
            iconTone={card.iconTone}
            available={card.available}
            badge={card.badge}
            animationDelayMs={index * 70}
          />
        ))}
      </div>
    </div>
  );
}
