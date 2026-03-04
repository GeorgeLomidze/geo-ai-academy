"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Users, Sparkles, Code, PenTool } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const courses = [
  {
    title: "AI Content Creation",
    description:
      "ისწავლე AI-ის გამოყენება კონტენტის შესაქმნელად — ტექსტი, სურათები, ვიდეო და სოციალური მედია.",
    price: "₾ 89",
    category: "AI",
    icon: Sparkles,
    duration: "8 კვირა",
    students: "127",
    color: "from-purple-600 to-brand-primary",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    title: "ვებ დეველოპმენტი",
    description:
      "HTML, CSS, JavaScript და React — ააწყე თანამედროვე ვებ აპლიკაციები ნულიდან.",
    price: "₾ 129",
    category: "Development",
    icon: Code,
    duration: "12 კვირა",
    students: "203",
    color: "from-brand-accent to-emerald-600",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Prompt Engineering",
    description:
      "დაეუფლე ChatGPT, Claude და Midjourney-ს ეფექტურ გამოყენებას პროფესიულ საქმიანობაში.",
    price: "₾ 69",
    category: "AI",
    icon: PenTool,
    duration: "6 კვირა",
    students: "185",
    color: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-600",
  },
] as const;

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function FeaturedCourses() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="rounded-lg bg-brand-primary-light text-brand-primary">
              კურსები
            </Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-secondary sm:text-4xl">
              პოპულარული კურსები
            </h2>
            <p className="mt-2 max-w-lg text-brand-muted">
              შეარჩიე შენთვის სასურველი კურსი და დაიწყე სწავლა დღესვე
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="text-brand-primary hover:text-brand-primary-hover"
          >
            <Link href="/courses">
              ყველა კურსი
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        {/* Course cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {courses.map((course) => {
            const Icon = course.icon;
            return (
              <motion.article
                key={course.title}
                variants={item}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition-all duration-300 will-change-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-primary/5"
              >
                {/* Card top gradient bar */}
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${course.color}`}
                />

                <div className="flex flex-1 flex-col p-6">
                  {/* Icon + Category */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl ${course.iconBg}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs text-brand-muted"
                    >
                      {course.category}
                    </Badge>
                  </div>

                  {/* Content */}
                  <h3 className="mt-4 font-display text-lg font-bold text-brand-secondary">
                    {course.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-muted">
                    {course.description}
                  </p>

                  {/* Meta */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-brand-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {course.students} სტუდენტი
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-5">
                    <span className="font-display text-xl font-bold text-brand-secondary">
                      {course.price}
                    </span>
                    <Button
                      size="sm"
                      className="rounded-xl bg-brand-primary text-white transition-all duration-200 hover:scale-[1.02] hover:bg-brand-primary-hover"
                    >
                      დეტალურად
                    </Button>
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
