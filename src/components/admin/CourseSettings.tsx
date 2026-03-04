"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CourseStatusBadge } from "./CourseStatusBadge";

type CourseSettingsProps = {
  course: {
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
};

export function CourseSettings({ course }: CourseSettingsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(course.status);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus as typeof status);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/courses");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="font-display text-lg font-semibold text-brand-secondary">
          სტატუსი
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          შეცვალეთ კურსის სტატუსი
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="space-y-2">
            <Label>მიმდინარე სტატუსი</Label>
            <div className="flex items-center gap-3">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-56 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">დრაფტი</SelectItem>
                  <SelectItem value="PUBLISHED">გამოქვეყნებული</SelectItem>
                  <SelectItem value="ARCHIVED">დაარქივებული</SelectItem>
                </SelectContent>
              </Select>

              {saving && <Loader2 className="size-4 animate-spin text-brand-muted" />}
              {saved && (
                <span className="text-sm text-emerald-600">შენახულია</span>
              )}
            </div>
          </div>

          <div className="ml-auto">
            <CourseStatusBadge status={status} />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-brand-primary-light/50 p-3">
          <ul className="space-y-1 text-xs text-brand-muted">
            <li>
              <strong className="text-brand-secondary">დრაფტი</strong> —
              კურსი არ ჩანს სტუდენტებისთვის
            </li>
            <li>
              <strong className="text-brand-secondary">გამოქვეყნებული</strong>{" "}
              — კურსი ხილულია კატალოგში
            </li>
            <li>
              <strong className="text-brand-secondary">დაარქივებული</strong> —
              კურსი დამალულია, მაგრამ ჩარიცხული სტუდენტები კვლავ ხედავენ
            </li>
          </ul>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-brand-danger">
          <AlertTriangle className="size-5" />
          საშიში ზონა
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          ეს მოქმედებები შეუქცევადია
        </p>

        <div className="mt-4">
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="rounded-xl">
                კურსის წაშლა
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>კურსის წაშლა</DialogTitle>
                <DialogDescription>
                  ნამდვილად გსურთ კურსის &ldquo;{course.title}&rdquo; წაშლა?
                  წაიშლება ყველა მოდული, გაკვეთილი და ჩარიცხვის ჩანაწერი.
                  ეს მოქმედება შეუქცევადია.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  className="rounded-xl"
                  disabled={deleting}
                >
                  გაუქმება
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="rounded-xl gap-2"
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  წაშლა
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
