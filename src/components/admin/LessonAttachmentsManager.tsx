"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileUp,
  Loader2,
  Trash2,
} from "lucide-react";
import type { LessonAttachmentRecord } from "@/lib/lesson-attachments";
import {
  formatAttachmentSize,
  getAttachmentIcon,
  isAllowedLessonAttachment,
  MAX_LESSON_ATTACHMENT_SIZE,
} from "@/lib/lesson-attachments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ACCEPTED_FILE_TYPES = [
  ".pdf",
  ".zip",
  ".rar",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  "image/*",
].join(",");

type UploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
};

export function LessonAttachmentsManager({
  lessonId,
  initialAttachments,
  onChange,
}: {
  lessonId: string | null;
  initialAttachments: LessonAttachmentRecord[];
  onChange?: (attachments: LessonAttachmentRecord[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const shouldNotifyChangeRef = useRef(false);

  useEffect(() => {
    shouldNotifyChangeRef.current = false;
    setAttachments(initialAttachments);
  }, [initialAttachments, lessonId]);

  useEffect(() => {
    if (!shouldNotifyChangeRef.current) {
      return;
    }

    shouldNotifyChangeRef.current = false;
    onChange?.(attachments);
  }, [attachments, onChange]);

  const isUploadDisabled = !lessonId;
  const hasUploadingItems = uploads.some((item) => item.status === "uploading");

  const note = useMemo(
    () =>
      "PDF, ZIP, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, სურათები — მაქსიმუმ 50MB",
    []
  );

  function updateUpload(id: string, next: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item))
    );
  }

  async function uploadFile(file: File) {
    const uploadId = crypto.randomUUID();

    setUploads((current) => [
      ...current,
      {
        id: uploadId,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      },
    ]);

    await new Promise<void>((resolve) => {
      const formData = new FormData();
      formData.append("lessonId", lessonId ?? "");
      formData.append("file", file);

      const request = new XMLHttpRequest();
      request.open("POST", "/api/admin/attachments");
      request.responseType = "json";
      request.withCredentials = true;

      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        updateUpload(uploadId, {
          progress: Math.round((event.loaded / event.total) * 100),
        });
      };

      request.onload = () => {
        const response = request.response as
          | { attachment?: LessonAttachmentRecord; error?: string }
          | null;

        if (request.status >= 200 && request.status < 300 && response?.attachment) {
          shouldNotifyChangeRef.current = true;
          setAttachments((current) => [...current, response.attachment!]);
          setUploads((current) => current.filter((item) => item.id !== uploadId));
          setError(null);
          resolve();
          return;
        }

        updateUpload(uploadId, {
          status: "error",
          error: response?.error ?? "ფაილის ატვირთვა ვერ მოხერხდა",
        });
        resolve();
      };

      request.onerror = () => {
        updateUpload(uploadId, {
          status: "error",
          error: "ფაილის ატვირთვა ვერ მოხერხდა",
        });
        resolve();
      };

      request.send(formData);
    });
  }

  async function handleFiles(fileList: FileList | File[]) {
    if (!lessonId) {
      setError("ჯერ შეინახე გაკვეთილი, შემდეგ დაამატე მასალები");
      return;
    }

    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    setError(null);

    for (const file of files) {
      if (!isAllowedLessonAttachment(file)) {
        setError("ფორმატი მხარდაუჭერელია");
        continue;
      }

      if (file.size > MAX_LESSON_ATTACHMENT_SIZE) {
        setError("ფაილის ზომა არ უნდა აღემატებოდეს 50MB-ს");
        continue;
      }

      await uploadFile(file);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleDelete(attachmentId: string) {
    setDeletingId(attachmentId);
    setError(null);

    try {
      const response = await fetch("/api/admin/attachments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attachmentId }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "მასალის წაშლა ვერ მოხერხდა");
        return;
      }

      shouldNotifyChangeRef.current = true;
      setAttachments((current) =>
        current.filter((attachment) => attachment.id !== attachmentId)
      );
    } catch {
      setError("კავშირის შეცდომაა, სცადე თავიდან");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-brand-border bg-brand-background/60 p-4">
      <div className="space-y-1">
        <h5 className="text-sm font-semibold text-brand-secondary">მასალები</h5>
        <p className="text-xs leading-5 text-brand-muted">{note}</p>
      </div>

      <div
        className={cn(
          "rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors",
          dragging
            ? "border-brand-primary bg-brand-primary-light"
            : "border-brand-border bg-brand-surface-light/40",
          isUploadDisabled && "opacity-70"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isUploadDisabled) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="sr-only"
          id={`lesson-attachments-${lessonId ?? "new"}`}
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files);
            }
          }}
          disabled={isUploadDisabled || hasUploadingItems}
        />

        <label
          htmlFor={`lesson-attachments-${lessonId ?? "new"}`}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3",
            isUploadDisabled && "cursor-not-allowed"
          )}
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary-light">
            <FileUp className="size-6 text-brand-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-brand-secondary">
              გადაათრიე ფაილები აქ ან დააჭირე ასარჩევად
            </p>
            <p className="text-xs text-brand-muted">
              {isUploadDisabled
                ? "ჯერ შეინახე გაკვეთილი, შემდეგ ატვირთე მასალები"
                : "ერთდროულად შეგიძლია რამდენიმე ფაილის დამატება"}
            </p>
          </div>
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-brand-danger">
          {error}
        </p>
      ) : null}

      {uploads.length > 0 ? (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="rounded-2xl border border-brand-border bg-brand-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-brand-secondary">
                  {upload.fileName}
                </p>
                {upload.status === "uploading" ? (
                  <span className="inline-flex items-center gap-2 text-xs text-brand-muted">
                    <Loader2 className="size-3.5 animate-spin" />
                    {upload.progress}%
                  </span>
                ) : null}
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-border">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    upload.status === "error" ? "bg-brand-danger" : "bg-brand-primary"
                  )}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>

              {upload.error ? (
                <p className="mt-2 text-xs text-brand-danger">{upload.error}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map((attachment) => {
            const Icon = getAttachmentIcon(attachment.fileType, attachment.fileName);

            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-primary-light">
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

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-xl text-brand-danger hover:bg-brand-danger/10 hover:text-brand-danger"
                      aria-label="მასალის წაშლა"
                      disabled={deletingId === attachment.id}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>მასალის წაშლა</AlertDialogTitle>
                      <AlertDialogDescription>
                        ეს ფაილი წაიშლება გაკვეთილიდან და სტუდენტებისთვის აღარ იქნება ხელმისაწვდომი.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        გაუქმება
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl bg-brand-danger text-white hover:bg-brand-danger/90"
                        onClick={(event) => {
                          event.preventDefault();
                          void handleDelete(attachment.id);
                        }}
                      >
                        წაშლა
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      ) : lessonId ? (
        <div className="rounded-2xl border border-dashed border-brand-border px-4 py-6 text-center text-sm text-brand-muted">
          ამ გაკვეთილზე ჯერ მასალები არ არის დამატებული.
        </div>
      ) : null}
    </section>
  );
}
