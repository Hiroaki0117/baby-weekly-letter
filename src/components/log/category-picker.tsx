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
    <div className="flex flex-wrap gap-2">
      {CATEGORY_OPTIONS.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
