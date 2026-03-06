"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#0A0A0A_0%,#1a1000_50%,#0A0A0A_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/image001.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-60"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.44)_0%,rgba(10,10,10,0.3)_24%,rgba(10,10,10,0.38)_44%,rgba(10,10,10,0.7)_68%,rgba(10,10,10,0.92)_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[56%] bg-[linear-gradient(90deg,rgba(10,10,10,0)_0%,rgba(10,10,10,0.16)_18%,rgba(10,10,10,0.48)_48%,rgba(10,10,10,0.82)_78%,rgba(10,10,10,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_36%,rgba(245,166,35,0.12),transparent_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,rgba(245,166,35,0.1),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.2)_0%,rgba(10,10,10,0.06)_24%,rgba(10,10,10,0.18)_60%,rgba(10,10,10,0.42)_100%)]" />
      </div>

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,166,35,0.18),transparent)]" />

      {/* Geometric grid decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Floating accent shapes */}
      <div className="pointer-events-none absolute -right-20 top-20 size-72 rounded-full bg-brand-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-10 size-56 rounded-full bg-brand-accent/10 blur-3xl" />

      {/* Diagonal accent line */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-[200%] origin-top-left rotate-[15deg] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
          {/* Text content */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
                <Sparkles className="size-3" />
                ახალი პლატფორმა
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl"
            >
              ისწავლე AI
              <br />
              ტექნოლოგიები
              <br />
              <span className="bg-gradient-to-r from-brand-primary via-brand-primary to-brand-accent bg-clip-text text-transparent">
                ქართულად
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-foreground sm:text-lg"
            >
              შეისწავლე ხელოვნური ინტელექტის უახლესი ტექნოლოგიები პროფესიონალ
              ტრენერთან ერთად. ვიდეო გაკვეთილები, პრაქტიკული პროექტები და
              სერთიფიკატი.
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
                <Link href="/register">
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
                <Link href="/courses">კურსების ნახვა</Link>
              </Button>
            </motion.div>

            {/* Social proof strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 flex items-center gap-6 border-t border-brand-border pt-6"
            >
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  500+
                </p>
                <p className="text-xs text-brand-muted">სტუდენტი</p>
              </div>
              <div className="h-8 w-px bg-brand-border" />
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  12+
                </p>
                <p className="text-xs text-brand-muted">კურსი</p>
              </div>
              <div className="h-8 w-px bg-brand-border" />
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  98%
                </p>
                <p className="text-xs text-brand-muted">კმაყოფილება</p>
              </div>
            </motion.div>
          </div>

          {/* Right side decorative element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
            aria-hidden="true"
          >
            <div className="relative size-80">
              {/* Orbiting rings */}
              <motion.div
                className="absolute inset-0 rounded-full border border-brand-primary/20"
                initial={{ rotate: 270 }}
                animate={reduceMotion ? undefined : { rotate: 630 }}
                transition={{
                  duration: 30,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <div className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent shadow-lg shadow-brand-accent/50" />
              </motion.div>
              <motion.div
                className="absolute inset-4 rounded-full border border-brand-primary/15"
                initial={{ rotate: 220 }}
                animate={reduceMotion ? undefined : { rotate: -140 }}
                transition={{
                  duration: 34,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <div className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent shadow-lg shadow-brand-accent/40" />
              </motion.div>
              <motion.div
                className="absolute inset-8 rounded-full border border-brand-accent/10"
                initial={{ rotate: 38 }}
                animate={reduceMotion ? undefined : { rotate: 398 }}
                transition={{
                  duration: 24,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <div className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/50" />
              </motion.div>

              {/* Center glow */}
              <motion.div
                className="absolute inset-16 rounded-full bg-brand-primary/20 blur-2xl"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: [0.45, 0.7, 0.45],
                        scale: [0.96, 1.04, 0.96],
                      }
                }
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute inset-20 flex items-center justify-center rounded-full bg-brand-accent shadow-[0_0_30px_rgba(255,214,10,0.22)]"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        scale: [1, 1.03, 1],
                        opacity: [0.92, 1, 0.92],
                      }
                }
                transition={{
                  duration: 5.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <span className="font-display text-4xl font-bold text-black/88">
                  AI
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-brand-background to-transparent" />
    </section>
  );
}
