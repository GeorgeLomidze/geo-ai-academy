"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuyButtonProps {
  courseId: string;
  price: number;
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function BuyButton({
  courseId,
  price,
  className,
  size = "lg",
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
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

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setError(data?.error ?? "გადახდის ბმული ვერ მოიძებნა, სცადეთ თავიდან");
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handleBuy}
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
          `შეძენა ${price} ₾`
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
    </div>
  );
}
