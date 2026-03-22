import {
  AudioWaveform,
  Clapperboard,
  FolderKanban,
  ImagePlus,
} from "lucide-react";
import { ToolFeatureCard } from "@/components/ai/ToolFeatureCard";

type LandingToolCard = {
  href: string;
  title: string;
  ctaLabel: string;
  icon: typeof ImagePlus;
  iconTone: string;
  available: boolean;
  badge?: string;
};

const AI_TOOL_CARDS: LandingToolCard[] = [
  {
    href: "/ai-tools/image",
    title: "სურათის გენერაცია",
    icon: ImagePlus,
    iconTone: "text-brand-accent",
    available: true,
    ctaLabel: "გენერატორის გახსნა",
  },
  {
    href: "/ai-tools/video",
    title: "ვიდეოს გენერაცია",
    icon: Clapperboard,
    iconTone: "text-brand-primary",
    available: true,
    ctaLabel: "გენერატორის გახსნა",
  },
  {
    href: "/ai-tools/audio",
    title: "აუდიო გენერაცია",
    icon: AudioWaveform,
    iconTone: "text-brand-accent",
    available: false,
    badge: "მალე",
    ctaLabel: "გვერდის ნახვა",
  },
  {
    href: "/ai-tools/projects",
    title: "პროექტები",
    icon: FolderKanban,
    iconTone: "text-brand-primary",
    available: true,
    ctaLabel: "პროექტების გახსნა",
  },
];

export function AIToolsSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="font-ui inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-brand-secondary backdrop-blur-sm">
            <span className="size-2 rounded-full bg-brand-primary" />
            AI ინსტრუმენტები
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {AI_TOOL_CARDS.map((card, index) => (
            <ToolFeatureCard
              key={card.href}
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
    </section>
  );
}
