"use client";

import { RouteErrorState } from "@/components/shared/RouteErrorState";

export default function CourseDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <RouteErrorState
      title="კურსის გვერდი ვერ ჩაიტვირთა"
      description="კურსის დეტალების მიღება ამ ეტაპზე ვერ მოხერხდა. სცადეთ თავიდან."
      reset={reset}
    />
  );
}
