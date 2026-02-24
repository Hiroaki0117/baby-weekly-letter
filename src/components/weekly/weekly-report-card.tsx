"use client";

import Link from "next/link";
import { formatWeekRange } from "@/lib/date";
import type { WeeklyReport } from "@/types";

type WeeklyReportCardProps = {
  report: WeeklyReport;
};

export function WeeklyReportCard({ report }: WeeklyReportCardProps) {
  const lines = report.content.split("\n").filter((l) => l.trim());
  const preview =
    lines.find(
      (l) => !l.startsWith("📮") && !l.startsWith("🌱") && l.trim().length > 0
    ) ?? "";

  return (
    <Link href={`/weekly/${report.id}`}>
      <div className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm shadow-primary/5 transition-all duration-200 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-1">
        {/* エアメール斜めストライプ */}
        <div className="airmail-stripe h-3 w-full" />

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {/* ポストマーク風 */}
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-primary/60 bg-primary/8">
              <span className="text-lg leading-none">✉</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {formatWeekRange(report.week_start, report.week_end)}
              </p>
              {preview && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {preview}
                </p>
              )}
            </div>
          </div>
          <span className="text-sm text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
