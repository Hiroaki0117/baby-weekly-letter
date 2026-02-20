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
      <div className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-primary/8 hover:-translate-y-0.5">
        {/* エアメール斜めストライプ */}
        <div className="airmail-stripe h-2.5 w-full" />

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {/* ポストマーク風 */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-primary/6">
              <span className="text-base leading-none">✉</span>
            </div>
            <div>
              <p className="font-mincho text-sm font-semibold text-foreground">
                {formatWeekRange(report.week_start, report.week_end)}
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
