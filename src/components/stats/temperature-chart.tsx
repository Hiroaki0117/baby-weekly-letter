"use client";

import { useMemo, useState } from "react";
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

const PERIOD_TABS = [
  { label: "1週間", days: 7 },
  { label: "2週間", days: 14 },
  { label: "1ヶ月", days: 30 },
] as const;

type ChartDataPoint = {
  label: string;
  timestamp: number;
  temperature: number;
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

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <div className="space-y-0.5 text-xs">
        {d && (
          <p className="text-muted-foreground">
            {d.getFullYear()}/{d.getMonth() + 1}/{d.getDate()} {d.getHours()}:{String(d.getMinutes()).padStart(2, "0")}
          </p>
        )}
        <p className={cn("font-bold", (item.value ?? 0) >= FEVER_LINE ? "text-red-500" : "text-foreground")}>
          {item.value}℃
        </p>
      </div>
    </div>
  );
}

type Props = {
  records: TemperatureRecord[];
};

export function TemperatureChart({ records }: Props) {
  const [periodDays, setPeriodDays] = useState(7);
  const [now] = useState(() => Date.now());

  const data = useMemo(() => {
    const cutoff = now - periodDays * 24 * 60 * 60 * 1000;

    return records
      .filter((r) => new Date(r.measured_at).getTime() >= cutoff)
      .map((r) => {
        const d = new Date(r.measured_at);
        return {
          label: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`,
          timestamp: d.getTime(),
          temperature: r.temperature,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [records, periodDays, now]);

  const yDomain = [35, 42] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">体温の推移</h3>
        <div className="flex gap-1">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.days}
              type="button"
              onClick={() => setPeriodDays(tab.days)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                periodDays === tab.days
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          この期間の体温記録がありません
        </p>
      ) : (
        <div className="h-80">
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
                ticks={[35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41, 41.5, 42]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v: number) => `${v}℃`}
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
