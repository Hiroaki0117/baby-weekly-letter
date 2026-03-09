"use client";

import { useMemo, useState } from "react";
import { startOfWeek, addWeeks, addDays, isAfter, format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { TemperatureRecord } from "@/types";

const TEMP_COLOR = "#fb923c"; // orange-400
const FEVER_LINE = 37.5;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 39℃以上を圧縮する変換（1℃ステップ → 0.5単位の高さ）
function compressTemp(t: number): number {
  if (t <= 39) return t;
  return 39 + (t - 39) / 2;
}

function decompressTemp(t: number): number {
  if (t <= 39) return t;
  return 39 + (t - 39) * 2;
}

// 変換後のtick位置（すべて0.5刻みで等間隔）
const Y_TICKS = [
  35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5,
];

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "yyyy年M月d日")}〜${format(weekEnd, "M月d日")}`;
}

type ChartDataPoint = {
  label: string;
  timestamp: number;
  temperature: number;
  displayTemp: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: ChartDataPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const d = item.payload ? new Date(item.payload.timestamp) : null;
  const realTemp = item.payload?.displayTemp;

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <div className="space-y-0.5 text-xs">
        {d && (
          <p className="text-muted-foreground">
            {d.getFullYear()}/{d.getMonth() + 1}/{d.getDate()} {d.getHours()}:{String(d.getMinutes()).padStart(2, "0")}
          </p>
        )}
        <p className={cn("font-bold", (realTemp ?? 0) >= FEVER_LINE ? "text-red-500" : "text-foreground")}>
          {realTemp}℃
        </p>
      </div>
    </div>
  );
}

type Props = {
  records: TemperatureRecord[];
};

export function TemperatureChart({ records }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const currentMonday = getMonday(new Date());
  const canGoNext = !isAfter(addWeeks(weekStart, 1), currentMonday);

  const data = useMemo(() => {
    const start = weekStart.getTime();
    const end = addDays(weekStart, 7).getTime();

    return records
      .filter((r) => {
        const t = new Date(r.measured_at).getTime();
        return t >= start && t < end;
      })
      .map((r) => {
        const d = new Date(r.measured_at);
        return {
          label: `${WEEKDAYS[d.getDay()]} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`,
          timestamp: d.getTime(),
          temperature: compressTemp(r.temperature),
          displayTemp: r.temperature,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [records, weekStart]);

  const yDomain = [35, compressTemp(42)] as const;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">体温の推移</h3>
        {/* 週ナビゲーション */}
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

      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          この週の体温記録がありません
        </p>
      ) : (
        <div className="h-[28rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                interval="preserveStartEnd"
              />
              <YAxis
                domain={yDomain}
                ticks={Y_TICKS}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v: number) => `${decompressTemp(v)}℃`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={FEVER_LINE}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: "37.5℃",
                  position: "right",
                  fontSize: 10,
                  fill: "#ef4444",
                }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke={TEMP_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: TEMP_COLOR }}
                activeDot={{ r: 5, fill: TEMP_COLOR }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
