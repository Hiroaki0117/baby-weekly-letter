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
} from "recharts";
import { cn } from "@/lib/utils";
import type { SleepRecord } from "@/types";

const SLEEP_COLOR = "#818cf8"; // indigo-400
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
  hours: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ChartDataPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  if (!item) return null;
  const h = Math.floor(item.hours);
  const m = Math.round((item.hours - h) * 60);

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <div className="space-y-0.5 text-xs">
        <p className="text-muted-foreground">{item.date}</p>
        <p className="font-bold text-foreground">
          {h}時間{m > 0 ? `${m}分` : ""}
        </p>
      </div>
    </div>
  );
}

type Props = {
  records: SleepRecord[];
};

export function SleepChart({ records }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const currentMonday = getMonday(new Date());
  const canGoNext = !isAfter(addWeeks(weekStart, 1), currentMonday);

  const data = useMemo(() => {
    const points: ChartDataPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLabel = `${WEEKDAYS[day.getDay()]}`;

      const dayRecords = records.filter((r) => r.sleep_date === dateStr);
      const totalMinutes = dayRecords.reduce((sum, r) => sum + r.duration_minutes, 0);

      points.push({
        label: dayLabel,
        date: format(day, "M/d"),
        hours: Math.round((totalMinutes / 60) * 10) / 10,
      });
    }

    return points;
  }, [records, weekStart]);

  const hasData = data.some((d) => d.hours > 0);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">睡眠時間の推移</h3>
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
          この週の睡眠記録がありません
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
                width={40}
                tickFormatter={(v: number) => `${v}h`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="hours"
                fill={SLEEP_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
