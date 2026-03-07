"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Clock3,
  GraduationCap,
  MonitorPlay,
  NotebookPen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    number: "01",
    title: "ვიდეო გაკვეთილები",
    icon: MonitorPlay,
    side: "left",
    desktopClass: "lg:left-0 lg:top-18 xl:left-4",
  },
  {
    number: "02",
    title: "24/7 წვდომა",
    icon: Clock3,
    side: "left",
    desktopClass: "lg:left-0 lg:top-[29.5rem] xl:left-4",
  },
  {
    number: "03",
    title: "TOP AI ხელსაწყოები",
    icon: NotebookPen,
    side: "right",
    desktopClass: "lg:right-0 lg:top-18 xl:right-4",
  },
  {
    number: "04",
    title: "პრაქტიკული გამოყენება",
    icon: GraduationCap,
    side: "right",
    desktopClass: "lg:right-0 lg:top-[29.5rem] xl:right-4",
  },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

export function WhyUs() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-brand-background py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#050505_0%,#0b0b0b_48%,#050505_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(245,166,35,0.14),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-brand-secondary backdrop-blur-sm">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <span className="size-2 rounded-full bg-brand-primary" />
              უპირატესობები
            </span>
          </Badge>
          <h2 className="mt-3 text-3xl text-white sm:text-4xl">
            რატომ GEO AI Academy?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-brand-muted sm:text-base">
            თანამედროვე სასწავლო გამოცდილება, სადაც ხარისხიანი კონტენტი,
            პრაქტიკა და მკაფიო სტრუქტურა ერთ პრემიუმ ეკოსისტემაში ერთიანდება.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:block lg:min-h-[690px]"
        >
          <motion.div
            variants={itemVariants}
            className="relative mx-auto flex size-[280px] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#ffcf33_0%,#f5a623_54%,#7a4a00_100%)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.56)] sm:size-[320px] lg:absolute lg:left-1/2 lg:top-1/2 lg:z-10 lg:size-[360px] lg:-translate-x-1/2 lg:-translate-y-1/2 xl:size-[400px]"
          >
            <div className="relative flex size-full flex-col items-center justify-center rounded-full border border-brand-border bg-[radial-gradient(circle_at_50%_30%,#262626_0%,#0a0a0a_74%)] px-8 text-center">
              <h3 className="text-3xl text-white sm:text-4xl">
                გამორჩეული
                <br />
                სასწავლო სისტემა
              </h3>
              <p className="mt-4 max-w-[16rem] text-sm leading-6 text-brand-muted">
                სტრუქტურა, ხარისხი და პრაქტიკა ერთ დახვეწილ გარემოში AI
                განათლებისთვის.
              </p>
            </div>
          </motion.div>

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.number}
                variants={itemVariants}
                animate={
                  reduceMotion
                    ? undefined
                    : feature.number === "01"
                      ? { x: [0, 14, -10, 0], y: [0, -18, 8, 0] }
                      : feature.number === "02"
                        ? { x: [0, -15, 12, 0], y: [0, 16, -9, 0] }
                        : feature.number === "03"
                          ? { x: [0, -18, 9, 0], y: [0, -14, 11, 0] }
                          : { x: [0, 17, -11, 0], y: [0, 18, -10, 0] }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration:
                          feature.number === "01"
                            ? 3.8
                            : feature.number === "02"
                              ? 4.1
                              : feature.number === "03"
                                ? 3.9
                                : 4.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: Number(feature.number) * 0.1,
                      }
                }
                className={cn(
                  "group relative overflow-visible rounded-[18px] border border-[#e0a315] bg-[linear-gradient(180deg,#ffcc2e_0%,#f2aa19_100%)] p-5 text-black shadow-[0_16px_36px_rgba(0,0,0,0.34)] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_18px_42px_rgba(0,0,0,0.42)] sm:p-6 lg:absolute lg:min-h-[132px] lg:w-[330px] xl:w-[348px]",
                  feature.desktopClass
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-[18px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.12)_100%)]" />
                <div
                  className={cn(
                    "hidden lg:absolute lg:top-1/2 lg:z-10 lg:flex lg:size-[96px] lg:-translate-y-1/2 lg:items-center lg:justify-center lg:rounded-full lg:border lg:border-brand-primary/24 lg:bg-[radial-gradient(circle_at_50%_28%,#242424_0%,#090909_78%)] lg:shadow-[0_14px_30px_rgba(0,0,0,0.38)]",
                    feature.side === "left" ? "lg:right-[-36px]" : "lg:left-[-36px]"
                  )}
                >
                  <Icon className="size-8 text-brand-secondary" />
                </div>

                <div
                  className={cn(
                    "flex items-start gap-4",
                    feature.side === "left"
                      ? "lg:pr-28"
                      : "lg:pl-28 lg:flex-row-reverse lg:text-right"
                  )}
                >
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-black/90 lg:hidden">
                    <Icon className="size-6 text-brand-secondary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "flex items-center gap-3",
                        feature.side === "right" && "lg:flex-row-reverse"
                      )}
                    >
                      <span className="text-4xl font-bold tabular-nums text-black/86">
                        {feature.number}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[1.55rem] leading-[1.08] text-black">
                      {feature.title}
                    </h3>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
