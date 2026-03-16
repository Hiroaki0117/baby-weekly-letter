"use client";

import Link from "next/link";
import { parseISO } from "date-fns";
import { formatMonthJa } from "@/lib/date";
import type { MonthlyReport } from "@/types";

type MonthlyReportCardProps = {
  report: MonthlyReport;
};

export function MonthlyReportCard({ report }: MonthlyReportCardProps) {
  const date = parseISO(report.month);
  const monthLabel = formatMonthJa(date.getFullYear(), date.getMonth());

  const lines = report.content.split("\n").filter((l) => l.trim());
  const preview =
    lines.find(
      (l) => !l.startsWith("📖") && l.trim().length > 0
    ) ?? "";

  return (
    <Link href={`/album/monthly/${report.id}`}>
      <div className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-primary/8 hover:-translate-y-0.5">
        {/* グラデーション上部バー */}
        <div className="h-2.5 w-full bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20" />

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {/* 本のアイコン */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
              <span className="text-base leading-none">📖</span>
            </div>
            <div>
              <p className="font-mincho text-sm font-semibold text-foreground">
                {monthLabel}のアルバム
              </p>
              {preview && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {preview}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
