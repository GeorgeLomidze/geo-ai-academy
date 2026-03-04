"use client";

import { motion } from "framer-motion";
import { Play, Award, Globe, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Play,
    title: "ვიდეო გაკვეთილები",
    description:
      "მაღალი ხარისხის ვიდეო კონტენტი, რომელიც ხელმისაწვდომია ნებისმიერ მოწყობილობაზე.",
  },
  {
    icon: Award,
    title: "სერთიფიკატი",
    description:
      "კურსის დასრულების შემდეგ მიიღე ვერიფიცირებული სერთიფიკატი შენი პორტფოლიოსთვის.",
  },
  {
    icon: Globe,
    title: "ქართულად",
    description:
      "სრულად ქართულენოვანი კურსები — ისწავლე შენს ენაზე, ბარიერების გარეშე.",
  },
  {
    icon: Clock,
    title: "24/7 წვდომა",
    description:
      "ისწავლე შენი ტემპით, ნებისმიერ დროს. კურსზე წვდომა შენ სამუდამოდ გექნება.",
  },
] as const;

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function WhyUs() {
  return (
    <section className="relative bg-brand-secondary py-20 sm:py-28">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <Badge className="rounded-lg bg-brand-primary/20 text-brand-primary-light">
            უპირატესობები
          </Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            რატომ GEO AI Academy?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-400">
            ჩვენ ვქმნით საუკეთესო სასწავლო გარემოს ქართველი სტუდენტებისთვის
          </p>
        </div>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={item}
                className="group rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-brand-primary/20 hover:bg-white/[0.06]"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-primary/15 transition-colors duration-300 group-hover:bg-brand-primary/25">
                  <Icon className="size-6 text-brand-primary-light" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
