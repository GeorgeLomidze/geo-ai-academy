import Link from "next/link";
import { AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "აუდიო გენერაცია - GEO AI Academy",
};

export default function AudioGeneratorPage() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-4 text-center">
      <div className="flex size-24 items-center justify-center rounded-full border border-brand-border bg-brand-surface">
        <AudioWaveform className="size-10 text-brand-accent" />
      </div>

      <h1 className="mt-8 text-3xl font-semibold text-brand-secondary">
        აუდიო გენერაცია
      </h1>

      <p className="mt-4 max-w-md text-brand-muted">
        მუსიკის და აუდიო ეფექტების გენერაცია მალე დაემატება
      </p>

      <span className="mt-6 inline-flex rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-sm font-medium text-brand-accent">
        მალე
      </span>

      <div className="mt-10">
        <Button
          asChild
          variant="outline"
          className="rounded-full border-brand-border px-6"
        >
          <Link href="/ai-tools">უკან დაბრუნება</Link>
        </Button>
      </div>
    </div>
  );
}
