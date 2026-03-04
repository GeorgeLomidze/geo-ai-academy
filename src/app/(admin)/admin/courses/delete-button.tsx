"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 rounded-lg p-0 text-brand-danger hover:bg-red-50 hover:text-brand-danger"
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">წაშლა</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>კურსის წაშლა</DialogTitle>
          <DialogDescription>
            ნამდვილად გსურთ კურსის &ldquo;{courseTitle}&rdquo; წაშლა? ეს
            მოქმედება წაშლის ყველა მოდულს და გაკვეთილს. მოქმედება
            შეუქცევადია.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
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
  );
}
