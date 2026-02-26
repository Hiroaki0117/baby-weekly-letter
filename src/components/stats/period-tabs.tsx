"use client";

import { cn } from "@/lib/utils";
import type { PeriodType } from "@/lib/stats";

const TABS: { key: PeriodType; label: string }[] = [
  { key: "weekly", label: "週別" },
  { key: "monthly", label: "月別" },
  { key: "yearly", label: "年別" },
];

type PeriodTabsProps = {
  period: PeriodType;
  onChangePeriod: (p: PeriodType) => void;
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  canGoNext?: boolean;
};

export function PeriodTabs({
  period,
  onChangePeriod,
  label,
  onPrev,
  onNext,
  canGoNext = true,
}: PeriodTabsProps) {
  return (
    <div className="space-y-2">
      {/* タブ */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChangePeriod(tab.key)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition-all",
              period === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-center gap-3">
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ‹
          </button>
        )}
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              canGoNext
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
