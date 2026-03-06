"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnrollButtonProps {
  courseId: string;
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function EnrollButton({ courseId, className, size = "lg" }: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        setError(data?.error ?? "სერვერის შეცდომა, სცადეთ თავიდან");
        return;
      }

      router.push("/my-courses");
      router.refresh();
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handleEnroll}
        disabled={loading}
        size={size}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            მიმდინარეობს...
          </>
        ) : (
          "კურსზე ჩაწერა"
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-brand-danger">{error}</p>
      )}
    </div>
  );
}
