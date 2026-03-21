"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ImageModelOption = {
  id: string;
  name: string;
  coins: number;
  provider: string;
  providerMark: string;
};

interface ModelSelectorPillProps {
  value: string;
  options: ImageModelOption[];
  onChange: (modelId: string) => void;
}

export function ModelSelectorPill({
  value,
  options,
  onChange,
}: ModelSelectorPillProps) {
  const selected = options.find((item) => item.id === value) ?? options[0];
  const grouped = options.reduce<Record<string, ImageModelOption[]>>((acc, item) => {
    acc[item.provider] ??= [];
    acc[item.provider].push(item);
    return acc;
  }, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="focus-ring inline-flex h-11 min-w-[220px] items-center justify-between gap-3 rounded-full border border-brand-accent/20 bg-[#171717] px-4 text-sm text-brand-secondary transition-colors hover:border-brand-accent/45 hover:bg-[#1b1b1b] xl:min-w-[230px]"
        >
          <span className="min-w-0 flex-1 truncate">{selected.name}</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-brand-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)] rounded-3xl border border-brand-accent/20 bg-[#111111] p-2 text-brand-secondary"
      >
        {Object.entries(grouped).map(([provider, models], groupIndex) => (
          <div key={provider}>
            {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="px-3 py-2 text-xs text-brand-muted">
              {provider}
            </DropdownMenuLabel>
            {models.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => onChange(item.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-3 py-3 focus:bg-white/5 focus:text-brand-secondary",
                  item.id === value && "bg-brand-accent/10 text-brand-accent"
                )}
              >
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="text-xs text-brand-accent tabular-nums">
                  ✦ {item.coins}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
