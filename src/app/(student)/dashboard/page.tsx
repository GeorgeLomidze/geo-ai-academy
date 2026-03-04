import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = user?.user_metadata?.name ?? "სტუდენტი";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        გამარჯობა, {name}!
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        კეთილი იყოს შენი მობრძანება სასწავლო პლატფორმაზე
      </p>

      {/* Empty state */}
      <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary-light">
          <BookOpen className="size-8 text-brand-primary" />
        </div>
        <h2 className="mt-5 font-display text-lg font-semibold text-brand-secondary">
          ჯერ არ გაქვს კურსები
        </h2>
        <p className="mt-2 max-w-sm text-sm text-brand-muted">
          დაათვალიერე ჩვენი კურსების კატალოგი და აირჩიე შენთვის სასურველი კურსი
        </p>
        <Button
          asChild
          className="mt-6 rounded-xl bg-brand-accent text-white hover:bg-brand-accent-hover"
        >
          <Link href="/courses">
            კურსების ნახვა
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
