"use client";

import { MILESTONE_CATEGORY_OPTIONS } from "@/types";
import type { MilestoneCategory } from "@/types";

type MilestoneCategoryFilterProps = {
  selected: MilestoneCategory | null;
  onChange: (category: MilestoneCategory | null) => void;
};

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 ring-blue-300",
  purple: "bg-purple-100 text-purple-700 ring-purple-300",
  orange: "bg-orange-100 text-orange-700 ring-orange-300",
  green: "bg-green-100 text-green-700 ring-green-300",
  gray: "bg-gray-100 text-gray-700 ring-gray-300",
};

export function MilestoneCategoryFilter({
  selected,
  onChange,
}: MilestoneCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
          selected === null
            ? "bg-foreground text-background shadow-sm"
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        }`}
      >
        すべて
      </button>
      {MILESTONE_CATEGORY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(selected === opt.value ? null : opt.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            selected === opt.value
              ? `${COLOR_MAP[opt.color]} ring-1`
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {opt.emoji} {opt.label}
        </button>
      ))}
    </div>
  );
}
