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
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span>📮</span>
            <span className="text-sm font-medium">
              {formatWeekRange(report.week_start, report.week_end)}
            </span>
          </div>
          {preview && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {preview}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
