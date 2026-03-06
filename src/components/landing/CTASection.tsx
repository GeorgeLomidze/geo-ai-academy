"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0A0A0A_0%,#1a1000_50%,#0A0A0A_100%)] py-20 sm:py-24">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_80%_0%,rgba(255,255,255,0.15),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
          მზად ხარ სწავლის დასაწყებად?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-foreground">
          შემოგვიერთდი 500+ სტუდენტს, რომლებმაც უკვე დაიწყეს AI ტექნოლოგიების
          შესწავლა ქართულად.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-2xl bg-brand-accent px-6 text-base font-bold text-black transition-all duration-200 hover:scale-[1.02] hover:bg-brand-accent-hover"
          >
            <Link href="/register">
              უფასოდ დარეგისტრირდი
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
