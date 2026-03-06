"use client";

import { RouteErrorState } from "@/components/shared/RouteErrorState";

export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <RouteErrorState
      title="სასწავლო გვერდი ვერ ჩაიტვირთა"
      description="გაკვეთილის ან კურსის მონაცემების მიღებისას შეცდომა მოხდა. სცადეთ ხელახლა."
      reset={reset}
    />
  );
}
