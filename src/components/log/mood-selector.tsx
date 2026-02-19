"use client";

import { cn } from "@/lib/utils";
import { MOOD_OPTIONS, type Mood } from "@/types";

type MoodSelectorProps = {
  value: Mood | undefined;
  onChange: (mood: Mood) => void;
};

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex gap-3">
      {MOOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border-2 px-5 py-3 transition-all duration-200",
            "hover:scale-105 active:scale-95",
            value === option.value
              ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
              : "border-transparent bg-muted hover:bg-accent hover:border-border"
          )}
        >
          <span className={cn("text-3xl transition-transform duration-200", value === option.value && "scale-110")}>
            {option.emoji}
          </span>
          <span className={cn(
            "text-xs font-medium transition-colors",
            value === option.value ? "text-primary" : "text-muted-foreground"
          )}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
