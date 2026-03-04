import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-background px-4">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-2xl font-bold text-brand-secondary"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-primary text-base font-bold text-white">
            G
          </span>
          {siteConfig.name}
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-8 text-center text-xs text-brand-muted">
        &copy; {new Date().getFullYear()} {siteConfig.name}
      </p>
    </div>
  );
}
