import Link from "next/link";
import { Button } from "@/components/ui/button";

const AI_TOOL_CARDS = [
  {
    href: "/ai-tools/image",
    emoji: "📷",
    title: "სურათის გენერაცია",
    comingSoon: false,
  },
  {
    href: "/ai-tools/video",
    emoji: "🎥",
    title: "ვიდეოს გენერაცია",
    comingSoon: false,
  },
  {
    href: "/ai-tools/audio",
    emoji: "🎵",
    title: "აუდიო გენერაცია",
    comingSoon: true,
  },
] as const;

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

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {AI_TOOL_CARDS.map((card) => (
            <section
              key={card.href}
              className="relative flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-brand-border bg-brand-surface p-6 text-center sm:p-8"
            >
              {card.comingSoon ? (
                <span className="absolute right-4 top-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  მალე
                </span>
              ) : null}
              <span className="text-6xl leading-none" aria-hidden="true">
                {card.emoji}
              </span>
              <h2 className="mt-8 text-balance text-3xl text-brand-secondary">
                {card.title}
              </h2>
              <div className="mt-8">
                {card.comingSoon ? (
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-brand-border px-5"
                  >
                    <Link href={card.href}>გვერდის ნახვა</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="rounded-full bg-brand-accent px-5 text-black hover:bg-brand-accent-hover"
                  >
                    <Link href={card.href}>გენერატორის გახსნა</Link>
                  </Button>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
