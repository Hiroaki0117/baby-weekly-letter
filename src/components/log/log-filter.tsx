"use client";

import { cn } from "@/lib/utils";
import { MOOD_OPTIONS, CATEGORY_OPTIONS, type Mood, type Child } from "@/types";
import { moodColors } from "./mood-selector";
import { CATEGORY_COLORS } from "./category-picker";
import { FilterShell } from "@/components/ui/filter-shell";

type LogFilterProps = {
  childrenList: Child[];
  selectedChildIds: string[];
  onChildIdsChange: (ids: string[]) => void;
  selectedMoods: Mood[];
  onMoodsChange: (moods: Mood[]) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  totalCount: number;
  filteredCount: number;
  onClear: () => void;
};

export function LogFilter({
  childrenList,
  selectedChildIds,
  onChildIdsChange,
  selectedMoods,
  onMoodsChange,
  selectedCategories,
  onCategoriesChange,
  searchText,
  onSearchTextChange,
  totalCount,
  filteredCount,
  onClear,
}: LogFilterProps) {
  const activeFilterCount =
    selectedChildIds.length + selectedMoods.length + selectedCategories.length;

  function toggleChild(childId: string) {
    if (selectedChildIds.includes(childId)) {
      onChildIdsChange(selectedChildIds.filter((id) => id !== childId));
    } else {
      onChildIdsChange([...selectedChildIds, childId]);
    }
  }

  function toggleMood(mood: Mood) {
    if (selectedMoods.includes(mood)) {
      onMoodsChange(selectedMoods.filter((m) => m !== mood));
    } else {
      onMoodsChange([...selectedMoods, mood]);
    }
  }

  function toggleCategory(category: string) {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  }

  return (
    <FilterShell
      searchText={searchText}
      onSearchTextChange={onSearchTextChange}
      activeFilterCount={activeFilterCount}
      totalCount={totalCount}
      filteredCount={filteredCount}
      onClear={onClear}
    >
      {/* 子供フィルター（2人以上の場合のみ） */}
      {childrenList.length >= 2 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            お子さま
          </p>
          <div className="flex flex-wrap gap-1.5">
            {childrenList.map((child) => {
              const selected = selectedChildIds.includes(child.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleChild(child.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                    "hover:scale-105 active:scale-95",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {child.name ?? "名前なし"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 気分フィルター */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          きぶん
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_OPTIONS.map((option) => {
            const selected = selectedMoods.includes(option.value);
            const colors = moodColors[option.value];
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleMood(option.value)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150",
                  "hover:scale-105 active:scale-95",
                  selected
                    ? colors?.active ?? "border-primary bg-primary/10"
                    : colors?.idle ?? "border-border bg-card"
                )}
              >
                <span className="text-sm leading-none">{option.emoji}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          カテゴリ
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_OPTIONS.map((option) => {
            const selected = selectedCategories.includes(option.value);
            const colors = CATEGORY_COLORS[option.value] ?? {
              idle: "border-border bg-card text-muted-foreground hover:bg-muted",
              active: "border-primary bg-primary/10 text-primary",
            };
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleCategory(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                  "hover:scale-105 active:scale-95",
                  selected ? colors.active : colors.idle
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </FilterShell>
  );
}
