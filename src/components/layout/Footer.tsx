import Link from "next/link";
import { navItems, siteConfig } from "@/lib/constants";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SocialLinks } from "@/components/layout/SocialLinks";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border bg-[#050505] text-brand-secondary">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <BrandLogo imageClassName="w-[270px]" />
            <p className="mt-3 text-sm text-brand-muted">
              {siteConfig.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display text-sm font-semibold text-brand-muted">
              ნავიგაცია
            </h3>
            <ul className="mt-3 space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground transition-colors duration-200 hover:text-brand-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/register"
                  className="text-sm text-foreground transition-colors duration-200 hover:text-brand-primary"
                >
                  რეგისტრაცია
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-display text-sm font-semibold text-brand-muted">
              სოციალური ქსელები
            </h3>
            <SocialLinks
              className="mt-4 flex flex-wrap gap-3"
              itemClassName="group inline-flex size-10 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-white transition-colors duration-200 hover:border-brand-primary"
              iconClassName="size-4.5 text-white transition-colors duration-200 group-hover:text-brand-accent"
            />
          </div>
        </div>

        <div className="mt-8 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
          &copy; {currentYear} {siteConfig.name}. ყველა უფლება დაცულია.
        </div>
      </div>
    </footer>
  );
}
