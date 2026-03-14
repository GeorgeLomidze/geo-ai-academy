import Link from "next/link";
import { ErrorState } from "@/components/error/ErrorState";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <ErrorState
      code="404"
      title="გვერდი ვერ მოიძებნა"
      description="მოთხოვნილი გვერდი არ არსებობს ან წაშლილია"
      fullHeight
      actions={
        <>
          <Button
            asChild
            className="rounded-xl bg-brand-primary text-black hover:bg-brand-primary-hover"
          >
            <Link href="/">მთავარ გვერდზე დაბრუნება</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/courses">კურსების ნახვა</Link>
          </Button>
        </>
      }
    />
  );
}
