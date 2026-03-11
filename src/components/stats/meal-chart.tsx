"use client";

import { useMemo, useState } from "react";
import { startOfWeek, addWeeks, addDays, isAfter, format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { MealRecord } from "@/types";

const AMOUNT_COLORS = {
  plenty: "#22c55e",  // green-500
  normal: "#3b82f6",  // blue-500
  little: "#eab308",  // yellow-500
  none: "#ef4444",    // red-500
};

const AMOUNT_LABELS = {
  plenty: "よく食べた",
  normal: "ふつう",
  little: "少なめ",
  none: "食べなかった",
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "yyyy年M月d日")}〜${format(weekEnd, "M月d日")}`;
}

type ChartDataPoint = {
  label: string;
  date: string;
  plenty: number;
  normal: number;
  little: number;
  none: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; color?: string }[];
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);
  if (total === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <div className="space-y-1 text-xs">
        {payload.filter((p) => (p.value ?? 0) > 0).map((p) => (
          <div key={p.dataKey} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">
              {AMOUNT_LABELS[p.dataKey as keyof typeof AMOUNT_LABELS]}:
            </span>
            <span className="font-bold text-foreground">{p.value}回</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  records: MealRecord[];
};

export function MealChart({ records }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const currentMonday = getMonday(new Date());
  const canGoNext = !isAfter(addWeeks(weekStart, 1), currentMonday);

  const data = useMemo(() => {
    const points: ChartDataPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLabel = `${WEEKDAYS[day.getDay()]}`;

      const dayRecords = records.filter((r) => r.meal_date === dateStr);

      points.push({
        label: dayLabel,
        date: format(day, "M/d"),
        plenty: dayRecords.filter((r) => r.amount === "plenty").length,
        normal: dayRecords.filter((r) => r.amount === "normal").length,
        little: dayRecords.filter((r) => r.amount === "little").length,
        none: dayRecords.filter((r) => r.amount === "none").length,
      });
    }

    return points;
  }, [records, weekStart]);

  const hasData = data.some((d) => d.plenty + d.normal + d.little + d.none > 0);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">食事量の推移</h3>
        <div className="flex h-8 items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-foreground">
            {formatWeekLabel(weekStart)}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            disabled={!canGoNext}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors",
              canGoNext
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            ›
          </button>
        </div>
      </div>

      {!hasData ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          この週の食事記録がありません
        </p>
      ) : (
        <div className="h-[20rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={30}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">
                    {AMOUNT_LABELS[value as keyof typeof AMOUNT_LABELS]}
                  </span>
                )}
              />
              <Bar dataKey="plenty" stackId="a" fill={AMOUNT_COLORS.plenty} radius={0} maxBarSize={40} />
              <Bar dataKey="normal" stackId="a" fill={AMOUNT_COLORS.normal} radius={0} maxBarSize={40} />
              <Bar dataKey="little" stackId="a" fill={AMOUNT_COLORS.little} radius={0} maxBarSize={40} />
              <Bar dataKey="none" stackId="a" fill={AMOUNT_COLORS.none} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
