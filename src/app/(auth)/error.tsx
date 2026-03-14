"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { ErrorState } from "@/components/error/ErrorState";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <ErrorState
      title="დროებითი შეფერხება"
      description="ავტორიზაციის გვერდის ჩატვირთვა დროებით ვერ მოხერხდა. სცადეთ თავიდან."
      actions={
        <>
          <Button
            type="button"
            className="rounded-xl bg-brand-primary text-black hover:bg-brand-primary-hover"
            onClick={reset}
          >
            <RefreshCcw className="size-4" />
            თავიდან ცდა
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/login">შესვლის გვერდზე დაბრუნება</Link>
          </Button>
        </>
      }
    />
  );
}
