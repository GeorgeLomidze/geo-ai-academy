"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { Button } from "@/components/ui/button";
import { socialLinks } from "@/lib/constants";

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const primaryCtaHref = isAuthenticated ? "/courses" : "/register";
  const aiToolsHref = "/ai-tools";
  const heroSocialLinks = [
    socialLinks.find((item) => item.shortLabel === "YT"),
    socialLinks.find((item) => item.shortLabel === "FB"),
    socialLinks.find((item) => item.shortLabel === "IN"),
    socialLinks.find((item) => item.shortLabel === "TK"),
    socialLinks.find((item) => item.shortLabel === "LN"),
  ].filter((item) => item !== undefined);

  return (
    <section className="relative isolate overflow-hidden bg-[#0A0A0A]">
      {/* Background image — blurred, covers full section */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/bg.png"
          alt=""
          fill
          priority
          className="object-cover object-right opacity-45"
        />
      </div>

      {/* Cinematic gradient overlay — dark left for text, face visible right */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(135deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.85)_30%,rgba(10,10,10,0.4)_60%,transparent_100%)]" />

      {/* Elegant amber gradient layers */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_-10%_-10%,rgba(255,214,10,0.13)_0%,rgba(255,214,10,0.04)_45%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_110%_110%,rgba(255,214,10,0.10)_0%,rgba(255,214,10,0.03)_50%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl"
            >
              ისწავლე და
              <br />
              გამოიყენე AI
              <br />
              <span className="bg-linear-to-r from-[#F5A623] via-[#F5A623] to-brand-accent bg-clip-text text-transparent">
                ინსტრუმენტები
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-foreground sm:text-lg"
            >
              შეისწავლე ხელოვნური ინტელექტის უახლესი მოდელები და გამოიყენე შენი
              ცოდნა პლატფორმიდან გაუსვლელად. ვიდეო გაკვეთილები, პრაქტიკული
              სამუშაოები და ტოპ ინსტრუმენტები.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button
                asChild
                size="lg"
                className="h-12 rounded-2xl bg-brand-accent px-6 text-base font-bold text-black transition-all duration-200 hover:scale-[1.02] hover:bg-brand-accent-hover"
              >
                <Link href={primaryCtaHref}>
                  დაიწყე სწავლა
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 rounded-2xl border border-brand-border bg-brand-surface/40 text-base text-foreground hover:bg-brand-surface-light hover:text-brand-secondary"
              >
                <Link href={aiToolsHref}>AI ინსტრუმენტები</Link>
              </Button>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 border-t border-brand-border pt-6"
            >
              <p className="text-sm text-brand-muted">
                გვიპოვე სოციალურ ქსელებში
              </p>
              <SocialLinks
                items={heroSocialLinks}
                className="mt-4 gap-3"
                itemClassName="group inline-flex size-12 items-center justify-center rounded-full border border-brand-border bg-brand-surface/55 text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-surface-light hover:shadow-md"
                iconClassName="size-5 text-brand-secondary transition-transform duration-200 ease-out group-hover:scale-110 group-hover:text-brand-accent"
              />
            </motion.div>
          </div>

          {/* Right side decorative element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative size-80">
              {/* Orbiting rings */}
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-full border border-brand-primary/20"
                initial={{ rotate: 270 }}
                animate={reduceMotion ? undefined : { rotate: 630 }}
                transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <div className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent shadow-lg shadow-brand-accent/50" />
              </motion.div>
              <motion.div
                className="pointer-events-none absolute inset-4 rounded-full border border-brand-primary/15"
                initial={{ rotate: 220 }}
                animate={reduceMotion ? undefined : { rotate: -140 }}
                transition={{ duration: 34, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <div className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent shadow-lg shadow-brand-accent/40" />
              </motion.div>
              <motion.div
                className="pointer-events-none absolute inset-8 rounded-full border border-brand-accent/10"
                initial={{ rotate: 38 }}
                animate={reduceMotion ? undefined : { rotate: 398 }}
                transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <div className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/50" />
              </motion.div>

              {/* Center glow */}
              <motion.div
                className="pointer-events-none absolute inset-16 rounded-full bg-brand-primary/20 blur-2xl"
                animate={reduceMotion ? undefined : { opacity: [0.45, 0.7, 0.45], scale: [0.96, 1.04, 0.96] }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-20"
                animate={reduceMotion ? undefined : { scale: [1, 1.03, 1], opacity: [0.92, 1, 0.92] }}
                transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Link
                  href={aiToolsHref}
                  aria-label="AI ინსტრუმენტებზე გადასვლა"
                  className="focus-ring flex size-full items-center justify-center rounded-full bg-brand-accent shadow-[0_0_30px_rgba(255,214,10,0.22)]"
                >
                  <span className="font-display text-4xl font-bold text-black/88">
                    AI
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 z-10 h-48 w-full bg-linear-to-t from-brand-background via-brand-background/80 to-transparent" />
    </section>
  );
}
