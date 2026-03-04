"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-secondary">
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(108,60,225,0.4),transparent)]" />

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
      <div className="pointer-events-none absolute -left-10 bottom-10 size-56 rounded-full bg-brand-accent/8 blur-3xl" />

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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary-light">
                <Sparkles className="size-3" />
                ახალი პლატფორმა
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              ისწავლე AI
              <br />
              ტექნოლოგიები
              <br />
              <span className="bg-gradient-to-r from-brand-primary via-purple-400 to-brand-accent bg-clip-text text-transparent">
                ქართულად
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg"
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
                className="h-12 rounded-xl bg-brand-accent px-6 text-base font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 hover:scale-[1.02] hover:bg-brand-accent-hover hover:shadow-xl hover:shadow-brand-accent/30"
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
                className="h-12 rounded-xl text-base text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <Link href="/courses">კურსების ნახვა</Link>
              </Button>
            </motion.div>

            {/* Social proof strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 flex items-center gap-6 border-t border-white/10 pt-6"
            >
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  500+
                </p>
                <p className="text-xs text-gray-500">სტუდენტი</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  12+
                </p>
                <p className="text-xs text-gray-500">კურსი</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  98%
                </p>
                <p className="text-xs text-gray-500">კმაყოფილება</p>
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
              <div className="absolute inset-0 animate-[spin_20s_linear_infinite] rounded-full border border-brand-primary/20" />
              <div className="absolute inset-4 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-brand-primary/15" />
              <div className="absolute inset-8 animate-[spin_25s_linear_infinite] rounded-full border border-brand-accent/10" />

              {/* Center glow */}
              <div className="absolute inset-16 rounded-full bg-brand-primary/20 blur-2xl" />
              <div className="absolute inset-20 flex items-center justify-center rounded-full bg-brand-primary/10 backdrop-blur-sm">
                <span className="font-display text-4xl font-bold text-white/80">
                  AI
                </span>
              </div>

              {/* Floating dots */}
              <div className="absolute left-0 top-1/2 size-2 rounded-full bg-brand-accent shadow-lg shadow-brand-accent/50" />
              <div className="absolute right-4 top-8 size-1.5 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/50" />
              <div className="absolute bottom-12 left-8 size-2.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-brand-background to-transparent" />
    </section>
  );
}
