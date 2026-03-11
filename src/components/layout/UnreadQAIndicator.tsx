"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface UnreadQAIndicatorProps {
  initialVisible?: boolean;
  className?: string;
}

export function UnreadQAIndicator({
  initialVisible = false,
  className = "",
}: UnreadQAIndicatorProps) {
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    async function refreshUnreadState() {
      try {
        const response = await fetch("/api/admin/notifications", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { unreadCount?: number };
        setVisible((data.unreadCount ?? 0) > 0);
      } catch {
        // Silent failure: indicator is decorative.
      }
    }

    void refreshUnreadState();

    const intervalId = window.setInterval(() => {
      void refreshUnreadState();
    }, 30000);

    const handleFocus = () => {
      void refreshUnreadState();
    };

    const handleSync = () => {
      void refreshUnreadState();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("qa:notifications-sync", handleSync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("qa:notifications-sync", handleSync);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <>
      <span className={cn("absolute size-2 rounded-full bg-emerald-400", className)} />
      <span
        className={cn(
          "absolute size-2 animate-ping rounded-full bg-emerald-400/70",
          className
        )}
      />
    </>
  );
}
