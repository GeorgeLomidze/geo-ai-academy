"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, FileText, PlayCircle, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLessonDuration, type LearningModule } from "@/lib/learn-shared";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";

type LessonSidebarProps = {
  courseTitle: string;
  courseSlug: string;
  modules: LearningModule[];
  progressPercentage: number;
  currentLessonId?: string;
};

function getDefaultOpenModules(
  modules: LearningModule[],
  currentLessonId?: string
) {
  if (currentLessonId) {
    const currentModule = modules.find((module) =>
      module.lessons.some((lesson) => lesson.id === currentLessonId)
    );

    if (currentModule) {
      return [currentModule.id];
    }
  }

  return modules
    .filter((module) => module.lessons.some((lesson) => !lesson.completed))
    .slice(0, 1)
    .map((module) => module.id);
}

export function LessonSidebar({
  courseTitle,
  courseSlug,
  modules,
  progressPercentage,
  currentLessonId,
}: LessonSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const defaultOpenModules = getDefaultOpenModules(modules, currentLessonId);

  return (
    <aside className="rounded-3xl border border-brand-border bg-brand-surface">
      <div className="flex items-center justify-between gap-4 border-b border-brand-border px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-muted">კურსის ნავიგაცია</p>
          <Link
            href={`/learn/${courseSlug}`}
            className="mt-1 block truncate text-sm font-semibold text-brand-secondary hover:text-brand-primary"
          >
            {courseTitle}
          </Link>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="lesson-sidebar-content"
        >
          {mobileOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          {mobileOpen ? "დამალვა" : "სიის ჩვენება"}
        </Button>
      </div>

      <div className="border-b border-brand-border px-5 py-4">
        <ProgressBar value={progressPercentage} label="საერთო პროგრესი" size="sm" />
      </div>

      <div
        id="lesson-sidebar-content"
        className={cn("px-3 py-3", mobileOpen ? "block" : "hidden lg:block")}
      >
        <Accordion type="multiple" defaultValue={defaultOpenModules} className="space-y-2">
          {modules.map((module) => (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="overflow-hidden rounded-2xl border border-brand-border bg-brand-background"
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BookOpen className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                    <span className="truncate text-sm font-semibold text-brand-secondary">
                      {module.title}
                    </span>
                  </div>
                  <div className="mt-2 pr-6">
                    <ProgressBar value={module.progressPercentage} size="sm" />
                  </div>
                  <p className="mt-2 text-xs text-brand-muted">
                    <span className="tabular-nums">{module.completedLessons}</span> /{" "}
                    <span className="tabular-nums">{module.totalLessons}</span> გაკვეთილი
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="space-y-2 px-3 pb-3">
                {module.lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLessonId;
                  const Icon = lesson.type === "VIDEO" ? PlayCircle : FileText;

                  return (
                    <Link
                      key={lesson.id}
                      href={lesson.href}
                      className={cn(
                        "flex items-start justify-between gap-3 rounded-2xl border px-3 py-3 transition-colors",
                        isCurrent
                          ? "border-brand-primary bg-brand-primary-light"
                          : "border-brand-border bg-brand-surface hover:border-brand-primary/30 hover:bg-brand-surface-light"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              isCurrent ? "text-brand-primary" : "text-brand-secondary"
                            )}
                          >
                            {lesson.title}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-brand-muted">
                          {lesson.type === "VIDEO" ? "ვიდეო" : "ტექსტი"} · {formatLessonDuration(lesson.duration)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {lesson.completed ? (
                          <CheckCircle2 className="size-4 text-brand-success" />
                        ) : null}
                        {isCurrent ? <Badge variant="outline">მიმდინარე</Badge> : null}
                      </div>
                    </Link>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </aside>
  );
}
