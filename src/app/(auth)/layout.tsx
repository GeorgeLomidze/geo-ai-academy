import { siteConfig } from "@/lib/constants";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-start bg-[#050505] px-4 pt-6 sm:pt-8">
      <div className="mb-5 text-center sm:mb-6">
        <BrandLogo priority imageClassName="w-[330px] sm:w-[372px]" />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-1">
        {children}
      </div>
      <p className="mt-6 pb-6 text-center text-xs text-brand-muted sm:mt-7">
        &copy; {new Date().getFullYear()} {siteConfig.name}
      </p>
    </div>
  );
}
