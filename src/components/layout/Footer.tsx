import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border bg-[#050505] text-brand-secondary">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-bold"
            >
              <span className="flex size-7 items-center justify-center rounded-xl bg-brand-primary text-sm font-bold text-black">
                G
              </span>
              {siteConfig.name}
            </Link>
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
              <li>
                <Link
                  href="/"
                  className="text-sm text-foreground transition-colors duration-200 hover:text-brand-primary"
                >
                  მთავარი
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="text-sm text-foreground transition-colors duration-200 hover:text-brand-primary"
                >
                  კურსები
                </Link>
              </li>
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
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-foreground">Facebook</span>
              </li>
              <li>
                <span className="text-sm text-foreground">Instagram</span>
              </li>
              <li>
                <span className="text-sm text-foreground">YouTube</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
          &copy; {currentYear} {siteConfig.name}. ყველა უფლება დაცულია.
        </div>
      </div>
    </footer>
  );
}
