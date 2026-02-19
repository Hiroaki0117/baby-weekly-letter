"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatWeekRange } from "@/lib/date";
import type { WeeklyReport } from "@/types";

type WeeklyReportCardProps = {
  report: WeeklyReport;
};

export function WeeklyReportCard({ report }: WeeklyReportCardProps) {
  // contentの最初の行（タイトル行）を除いた本文の冒頭を表示
  const lines = report.content.split("\n").filter((l) => l.trim());
  const preview =
    lines.find(
      (l) => !l.startsWith("📮") && !l.startsWith("🌱") && l.trim().length > 0
    ) ?? "";

  return (
    <Link href={`/weekly/${report.id}`}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-orange-400 to-yellow-400" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📮</span>
              <span className="text-sm font-semibold text-foreground">
                {formatWeekRange(report.week_start, report.week_end)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              読む →
            </span>
          </div>
          {preview && (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {preview}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
