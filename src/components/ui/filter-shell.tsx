"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type FilterShellProps = {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  searchPlaceholder?: string;
  activeFilterCount: number;
  totalCount: number;
  filteredCount: number;
  onClear: () => void;
  children: ReactNode;
};

export function FilterShell({
  searchText,
  onSearchTextChange,
  searchPlaceholder = "キーワード検索...",
  activeFilterCount,
  totalCount,
  filteredCount,
  onClear,
  children,
}: FilterShellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFiltering = activeFilterCount > 0 || searchText.trim() !== "";

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
            placeholder={searchPlaceholder}
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

      {/* 展開エリア */}
      {isExpanded && (
        <div className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-4">
          {children}

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
