"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteQAItemButtonProps {
  endpoint: string;
  dialogTitle: string;
  dialogDescription: string;
  onDeleted?: () => void | Promise<void>;
  className?: string;
  iconOnly?: boolean;
  label?: string;
  refreshAfterDelete?: boolean;
}

export function DeleteQAItemButton({
  endpoint,
  dialogTitle,
  dialogDescription,
  onDeleted,
  className,
  iconOnly = false,
  label = "წაშლა",
  refreshAfterDelete = true,
}: DeleteQAItemButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson
        ? ((await response.json()) as { error?: string })
        : null;

      if (!response.ok) {
        setError(data?.error ?? "წაშლა ვერ მოხერხდა");
        return;
      }

      setOpen(false);
      await onDeleted?.();

      if (refreshAfterDelete) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={iconOnly ? "icon-sm" : "sm"}
            className={cn(
              "rounded-xl text-brand-danger hover:bg-brand-danger/10 hover:text-brand-danger",
              iconOnly && "size-8 p-0"
            )}
            aria-label={label}
          >
            <Trash2 className="size-4" />
            {!iconOnly && label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p role="alert" className="text-sm text-brand-danger">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">გაუქმება</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              წაშლა
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
