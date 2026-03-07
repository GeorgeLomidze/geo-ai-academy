import { siteConfig } from "@/lib/constants";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#050505] px-4">
      <div className="mb-8 text-center">
        <BrandLogo priority imageClassName="w-[330px] sm:w-[372px]" />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-1">
        {children}
      </div>
      <p className="mt-8 text-center text-xs text-brand-muted">
        &copy; {new Date().getFullYear()} {siteConfig.name}
      </p>
    </div>
  );
}
