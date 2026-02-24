"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "@/types";

type CategoryPickerProps = {
  value: string[];
  onChange: (categories: string[]) => void;
};

const CATEGORY_COLORS: Record<string, { idle: string; active: string }> = {
  meal:           { idle: "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100",  active: "border-orange-400 bg-orange-200 text-orange-800" },
  sleep:          { idle: "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100", active: "border-violet-400 bg-violet-200 text-violet-800" },
  play:           { idle: "border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100", active: "border-yellow-400 bg-yellow-200 text-yellow-800" },
  word:           { idle: "border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100",         active: "border-teal-400 bg-teal-200 text-teal-800" },
  motor:          { idle: "border-green-200 bg-green-50 text-green-600 hover:bg-green-100",      active: "border-green-400 bg-green-200 text-green-800" },
  health:         { idle: "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100",          active: "border-rose-400 bg-rose-200 text-rose-800" },
  growth:         { idle: "border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100",          active: "border-pink-400 bg-pink-200 text-pink-800" },
  parent_feeling: { idle: "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",          active: "border-blue-400 bg-blue-200 text-blue-800" },
};

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  function toggle(category: string) {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      onChange([...value, category]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_OPTIONS.map((option) => {
        const selected = value.includes(option.value);
        const colors = CATEGORY_COLORS[option.value] ?? {
          idle: "border-border bg-card text-muted-foreground hover:bg-muted",
          active: "border-primary bg-primary/10 text-primary",
        };
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
              "hover:scale-105 active:scale-95",
              selected ? colors.active : colors.idle
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
