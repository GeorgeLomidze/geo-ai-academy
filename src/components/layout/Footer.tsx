import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border bg-brand-secondary text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-bold"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold">
                G
              </span>
              {siteConfig.name}
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              {siteConfig.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
              ნავიგაცია
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  მთავარი
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  კურსები
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  რეგისტრაცია
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
              სოციალური ქსელები
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-gray-300">Facebook</span>
              </li>
              <li>
                <span className="text-sm text-gray-300">Instagram</span>
              </li>
              <li>
                <span className="text-sm text-gray-300">YouTube</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          &copy; {currentYear} {siteConfig.name}. ყველა უფლება დაცულია.
        </div>
      </div>
    </footer>
  );
}
