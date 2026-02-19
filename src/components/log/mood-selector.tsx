"use client";

import { cn } from "@/lib/utils";
import { MOOD_OPTIONS, type Mood } from "@/types";

type MoodSelectorProps = {
  value: Mood | undefined;
  onChange: (mood: Mood) => void;
};

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex gap-2">
      {MOOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border-2 px-4 py-2 transition-colors",
            value === option.value
              ? "border-primary bg-primary/10"
              : "border-transparent bg-muted hover:bg-muted/80"
          )}
        >
          <span className="text-2xl">{option.emoji}</span>
          <span className="text-xs text-muted-foreground">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
