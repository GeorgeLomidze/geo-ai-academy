import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutFailedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-500/10">
          <XCircle className="size-8 text-red-500" />
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold text-brand-secondary">
          გადახდა ვერ მოხერხდა
        </h1>

        <p className="mt-3 text-brand-muted">
          სამწუხაროდ, გადახდა ვერ დასრულდა. გთხოვთ სცადოთ თავიდან ან
          დაუკავშირდეთ მხარდაჭერას.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-brand-accent font-bold text-black hover:bg-brand-accent-hover"
          >
            <Link href="/courses">თავიდან ცდა</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link href="/">მთავარი გვერდი</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
