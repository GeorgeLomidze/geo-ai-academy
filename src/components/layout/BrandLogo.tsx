import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="მთავარ გვერდზე დაბრუნება"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src="/logo.png"
        alt="GEO AI Academy"
        width={330}
        height={221}
        priority={priority}
        sizes="(max-width: 768px) 255px, 330px"
        className={cn("block h-auto w-[255px] object-contain", imageClassName)}
      />
    </Link>
  );
}
