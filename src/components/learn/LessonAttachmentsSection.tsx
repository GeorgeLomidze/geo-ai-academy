import { Download } from "lucide-react";
import type { LearningLessonDetail } from "@/lib/learn-shared";
import {
  formatAttachmentSize,
  getAttachmentIcon,
} from "@/lib/lesson-attachments";
import { Button } from "@/components/ui/button";

export function LessonAttachmentsSection({
  attachments,
}: {
  attachments: LearningLessonDetail["attachments"];
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-balance font-display text-2xl font-bold text-brand-secondary">
            მასალები
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            ჩამოტვირთე გაკვეთილთან დაკავშირებული დამატებითი ფაილები.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {attachments.map((attachment) => {
          const Icon = getAttachmentIcon(attachment.fileType, attachment.fileName);

          return (
            <div
              key={attachment.id}
              className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-light">
                  <Icon className="size-5 text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-secondary">
                    {attachment.fileName}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {formatAttachmentSize(attachment.fileSize)}
                  </p>
                </div>
              </div>

              <Button asChild className="rounded-xl">
                <a href={`/api/attachments/${attachment.id}`}>
                  <Download className="size-4" />
                  ჩამოტვირთვა
                </a>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
