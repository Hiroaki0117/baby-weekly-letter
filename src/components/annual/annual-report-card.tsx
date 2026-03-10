"use client";

import type { AnnualReport } from "@/types";
import { isInCooldown, getCooldownRemaining } from "@/lib/annual-report/data";

type AnnualReportCardProps = {
  report: AnnualReport;
  onView: (report: AnnualReport) => void;
};

export function AnnualReportCard({ report, onView }: AnnualReportCardProps) {
  const cooldown = isInCooldown(report.generated_at);
  const remainingMs = cooldown
    ? getCooldownRemaining(report.generated_at)
    : 0;
  const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

  return (
    <button
      onClick={() => onView(report)}
      className="w-full text-left"
    >
      <div className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-primary/8 hover:-translate-y-0.5">
        <div className="h-2.5 w-full bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-amber-300/20" />

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/15 to-amber-400/5 ring-1 ring-amber-500/20">
              <span className="text-base leading-none">📚</span>
            </div>
            <div>
              <p className="font-mincho text-sm font-semibold text-foreground">
                {report.content.coverTitle}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {report.content.childAge && `${report.content.childAge} ・ `}
                {report.content.monthHighlights.length}ヶ月分
                {cooldown && (
                  <span className="ml-2 text-amber-600">
                    （{remainingHours}時間後に再生成可能）
                  </span>
                )}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary">
            →
          </span>
        </div>
      </div>
    </button>
  );
}
