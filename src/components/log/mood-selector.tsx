"use client";

import { cn } from "@/lib/utils";
import { MOOD_OPTIONS, type Mood } from "@/types";

type MoodSelectorProps = {
  value: Mood | undefined;
  onChange: (mood: Mood) => void;
};

const moodColors: Record<string, { idle: string; active: string }> = {
  moved: {
    idle: "border-rose-300 bg-rose-50 hover:border-rose-400 hover:bg-rose-100",
    active: "border-rose-400 bg-rose-100 shadow-lg shadow-rose-200",
  },
  happy: {
    idle: "border-yellow-300 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100",
    active: "border-yellow-400 bg-yellow-100 shadow-lg shadow-yellow-200",
  },
  neutral: {
    idle: "border-sky-300 bg-sky-50 hover:border-sky-400 hover:bg-sky-100",
    active: "border-sky-400 bg-sky-100 shadow-lg shadow-sky-200",
  },
  tired: {
    idle: "border-indigo-200 bg-indigo-50 hover:border-indigo-300 hover:bg-indigo-100",
    active: "border-indigo-300 bg-indigo-100 shadow-lg shadow-indigo-200",
  },
  sad: {
    idle: "border-violet-300 bg-violet-50 hover:border-violet-400 hover:bg-violet-100",
    active: "border-violet-400 bg-violet-100 shadow-lg shadow-violet-200",
  },
};

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {MOOD_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const colors = moodColors[option.value] ?? {
          idle: "border-border bg-card hover:border-primary/40 hover:bg-muted/80",
          active: "border-primary bg-primary/10 shadow-lg shadow-primary/20",
        };
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all duration-200",
              "aspect-square",
              "hover:scale-105 active:scale-95",
              isSelected ? cn(colors.active, "scale-110") : colors.idle
            )}
          >
            <span
              className={cn(
                "text-2xl sm:text-3xl leading-none transition-transform duration-200",
                isSelected && "scale-110"
              )}
            >
              {option.emoji}
            </span>
            <span
              className={cn(
                "text-[9px] sm:text-[10px] font-medium leading-none",
                isSelected ? "text-foreground" : "text-muted-foreground"
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
