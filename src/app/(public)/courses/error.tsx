"use client";

import { RouteErrorState } from "@/components/shared/RouteErrorState";

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <RouteErrorState
      title="კურსების ჩატვირთვა ვერ მოხერხდა"
      description="მოთხოვნის დამუშავებისას შეცდომა მოხდა. სცადეთ გვერდის ხელახლა ჩატვირთვა."
      reset={reset}
    />
  );
}
