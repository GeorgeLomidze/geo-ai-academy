import { Facebook, Instagram, Linkedin, Music2, Youtube } from "lucide-react";
import { socialLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SocialLinksProps = {
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  showLabels?: boolean;
};

const iconMap = {
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  linkedin: Linkedin,
  instagram: Instagram,
} as const;

export function SocialLinks({
  className,
  itemClassName,
  iconClassName,
  labelClassName,
  showLabels = false,
}: SocialLinksProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {socialLinks.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className={cn(
              "group inline-flex items-center gap-2",
              showLabels ? "rounded-full px-4 py-2.5" : "",
              itemClassName
            )}
          >
            <Icon className={cn("size-5", iconClassName)} />
            {showLabels ? (
              <span
                className={cn(
                  "text-sm font-medium text-brand-muted transition-colors duration-200 group-hover:text-brand-secondary",
                  labelClassName
                )}
              >
                {item.shortLabel}
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
