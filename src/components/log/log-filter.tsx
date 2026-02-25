"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MOOD_OPTIONS, CATEGORY_OPTIONS, type Mood, type Child } from "@/types";
import { moodColors } from "./mood-selector";
import { CATEGORY_COLORS } from "./category-picker";
import { Input } from "@/components/ui/input";

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
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount =
    selectedChildIds.length + selectedMoods.length + selectedCategories.length;
  const isFiltering = activeFilterCount > 0 || searchText.trim() !== "";

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
    <div className="space-y-3">
      {/* 検索バー + フィルタートグル */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            type="text"
            placeholder="キーワード検索..."
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            className="pl-9 h-9 border-border/60 bg-background/60 text-sm focus:border-primary/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "relative flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
            isExpanded || activeFilterCount > 0
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="hidden sm:inline">フィルター</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 展開エリア: 気分 + カテゴリ */}
      {isExpanded && (
        <div className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-4">
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

          {/* クリアボタン */}
          {isFiltering && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                クリア
              </button>
            </div>
          )}
        </div>
      )}

      {/* フィルター結果件数 */}
      {isFiltering && (
        <p className="text-[11px] text-muted-foreground">
          {filteredCount}件 / 全{totalCount}件
        </p>
      )}
    </div>
  );
}
