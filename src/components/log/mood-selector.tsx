"use client";

import { cn } from "@/lib/utils";
import { MOOD_OPTIONS, type Mood } from "@/types";

type MoodSelectorProps = {
  value: Mood | undefined;
  onChange: (mood: Mood) => void;
};

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex gap-4">
      {MOOD_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-18 w-18 flex-col items-center justify-center gap-1 rounded-full border-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              isSelected
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-110"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/80"
            )}
            style={{ width: "4.5rem", height: "4.5rem" }}
          >
            <span
              className={cn(
                "text-2xl leading-none transition-transform duration-200",
                isSelected && "scale-110"
              )}
            >
              {option.emoji}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium leading-none transition-colors",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
