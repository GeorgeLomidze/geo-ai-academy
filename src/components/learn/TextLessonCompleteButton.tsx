"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TextLessonCompleteButtonProps = {
  lessonId: string;
  initialCompleted: boolean;
};

export function TextLessonCompleteButton({
  lessonId,
  initialCompleted,
}: TextLessonCompleteButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          completed: true,
        }),
      });

      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        setError(data?.error ?? "გაკვეთილის დასრულება ვერ მოხერხდა");
        return;
      }

      setCompleted(true);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleComplete}
        disabled={loading || completed}
        className="rounded-xl bg-brand-primary text-black hover:bg-brand-primary-hover"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {completed ? "დასრულებულია" : "დასრულება"}
      </Button>

      {error ? <p className="text-sm text-brand-danger">{error}</p> : null}
    </div>
  );
}
