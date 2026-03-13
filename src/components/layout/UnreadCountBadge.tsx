import { cn } from "@/lib/utils";

interface UnreadCountBadgeProps {
  count: number;
  className?: string;
}

function formatUnreadCount(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

export function UnreadCountBadge({
  count,
  className,
}: UnreadCountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1",
        className
      )}
    >
      {formatUnreadCount(count)}
    </span>
  );
}
