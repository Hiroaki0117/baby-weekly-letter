"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "@/types";

type CategoryPickerProps = {
  value: string[];
  onChange: (categories: string[]) => void;
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
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_OPTIONS.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
              "hover:scale-105 active:scale-95",
              selected
                ? "border-primary/70 bg-primary text-primary-foreground shadow-sm"
                : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
