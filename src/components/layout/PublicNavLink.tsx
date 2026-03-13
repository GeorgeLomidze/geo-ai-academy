"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

type PublicNavLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
};

function getHashId(href: string) {
  if (href.startsWith("/#")) {
    return href.slice(2);
  }

  if (href.startsWith("#")) {
    return href.slice(1);
  }

  return null;
}

export function PublicNavLink({
  href,
  className,
  children,
  onNavigate,
}: PublicNavLinkProps) {
  const pathname = usePathname();
  const hashId = getHashId(href);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();

    if (!hashId || pathname !== "/") {
      return;
    }

    const target = document.getElementById(decodeURIComponent(hashId));

    if (!target) {
      return;
    }

    event.preventDefault();
    window.history.replaceState(null, "", `/#${hashId}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
