"use client";

import { useEffect, useState } from "react";

type ClientDateTextProps = {
  value: string;
  format: (value: string) => string;
  className?: string;
  fallback?: string;
};

export function ClientDateText({
  value,
  format,
  className,
  fallback = "",
}: ClientDateTextProps) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    setText(format(value));
  }, [format, value]);

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
