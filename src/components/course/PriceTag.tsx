import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PriceTag({ price, className, size = "md" }: PriceTagProps) {
  const isFree = price === 0;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl",
  };

  if (isFree) {
    return (
      <span
        className={cn(
          "font-display font-bold text-brand-accent",
          sizeClasses[size],
          className
        )}
      >
        უფასო
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-display font-bold text-brand-secondary",
        sizeClasses[size],
        className
      )}
    >
      {price} ₾
    </span>
  );
}
