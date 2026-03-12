"use client";

import { formatWeekRange } from "@/lib/date";

type UngeneratedWeekCardProps = {
  weekStart: string;
  weekEnd: string;
  generating: boolean;
  onGenerate: (weekStart: string, weekEnd: string) => void;
};

export function UngeneratedWeekCard({
  weekStart,
  weekEnd,
  generating,
  onGenerate,
}: UngeneratedWeekCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-card/50 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/30">
            <span className="text-lg leading-none opacity-40">✉</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground/70">
              {formatWeekRange(weekStart, weekEnd)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              まだアルバムが作成されていません
            </p>
          </div>
        </div>
        <button
          onClick={() => onGenerate(weekStart, weekEnd)}
          disabled={generating}
          className="flex-shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
              生成中...
            </span>
          ) : (
            "作成する"
          )}
        </button>
      </div>
    </div>
  );
}
