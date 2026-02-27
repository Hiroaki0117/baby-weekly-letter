"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Scatter,
} from "recharts";
import { calcMonthAge } from "@/lib/growth";
import {
  maleHeight,
  maleWeight,
  femaleHeight,
  femaleWeight,
} from "@/lib/growth-standards";
import type { GrowthRecord, Gender } from "@/types";

type Props = {
  records: GrowthRecord[];
  birthDate: string;
  gender: Gender | null;
  compact?: boolean;
};

type TabType = "height" | "weight";

type ChartDataPoint = {
  monthAge: number;
  value: number | null;
  p3?: number;
  p10?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  p97?: number;
  band3_10?: [number, number];
  band10_25?: [number, number];
  band25_75?: [number, number];
  band75_90?: [number, number];
  band90_97?: [number, number];
};

function buildChartData(
  records: GrowthRecord[],
  birthDate: string,
  tab: TabType,
  showStandard: boolean,
  gender: Gender | null
): ChartDataPoint[] {
  // 標準曲線データ
  const standards =
    showStandard && gender
      ? tab === "height"
        ? gender === "male"
          ? maleHeight
          : femaleHeight
        : gender === "male"
          ? maleWeight
          : femaleWeight
      : [];

  // 標準曲線のMap
  const stdMap = new Map(standards.map((s) => [s.monthAge, s]));

  // 自分のデータ
  const myData = records
    .map((r) => ({
      monthAge: calcMonthAge(birthDate, r.measured_date),
      value: tab === "height" ? r.height_cm : r.weight_kg,
    }))
    .filter((d) => d.value !== null);

  // 標準曲線の月齢をすべて含める
  const allMonthAges = new Set<number>();
  standards.forEach((s) => allMonthAges.add(s.monthAge));
  myData.forEach((d) => allMonthAges.add(d.monthAge));

  const sorted = Array.from(allMonthAges).sort((a, b) => a - b);

  // myDataのMapを作成
  const myMap = new Map<number, number>();
  myData.forEach((d) => {
    if (d.value !== null) myMap.set(d.monthAge, d.value);
  });

  return sorted.map((monthAge) => {
    const std = stdMap.get(monthAge);
    const value = myMap.get(monthAge) ?? null;
    return {
      monthAge,
      value,
      p3: std?.p3,
      p10: std?.p10,
      p25: std?.p25,
      p50: std?.p50,
      p75: std?.p75,
      p90: std?.p90,
      p97: std?.p97,
      band3_10: std ? [std.p3, std.p10] as [number, number] : undefined,
      band10_25: std ? [std.p10, std.p25] as [number, number] : undefined,
      band25_75: std ? [std.p25, std.p75] as [number, number] : undefined,
      band75_90: std ? [std.p75, std.p90] as [number, number] : undefined,
      band90_97: std ? [std.p90, std.p97] as [number, number] : undefined,
    };
  });
}

function GrowthTooltip({
  active,
  payload,
  tab,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number | [number, number]; payload?: ChartDataPoint }>;
  tab: TabType;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const unit = tab === "height" ? "cm" : "kg";
  const label = tab === "height" ? "身長" : "体重";

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground">
        {point.monthAge}ヶ月
      </p>
      {point.value !== null && (
        <p className="text-xs text-foreground">
          {label}: <span className="font-semibold">{point.value}{unit}</span>
        </p>
      )}
      {point.p50 != null && (
        <p className="text-xs text-muted-foreground">
          標準(50%): {point.p50}{unit}
        </p>
      )}
    </div>
  );
}

export function GrowthChart({ records, birthDate, gender, compact }: Props) {
  const [tab, setTab] = useState<TabType>("height");
  const defaultShowStandard = gender !== null;
  const [showStandard, setShowStandard] = useState(defaultShowStandard);

  const data = useMemo(
    () => buildChartData(records, birthDate, tab, showStandard, gender),
    [records, birthDate, tab, showStandard, gender]
  );

  const hasHeight = records.some((r) => r.height_cm != null);
  const hasWeight = records.some((r) => r.weight_kg != null);

  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        成長記録を追加するとグラフが表示されます
      </p>
    );
  }

  const unit = tab === "height" ? "cm" : "kg";
  const chartHeight = compact ? 200 : 280;
  const bandColor = gender === "female" ? "255, 182, 193" : "135, 206, 250";

  return (
    <div className="space-y-3">
      {/* タブ + 標準曲線トグル */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {hasHeight && (
            <button
              onClick={() => setTab("height")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === "height"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              身長
            </button>
          )}
          {hasWeight && (
            <button
              onClick={() => setTab("weight")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === "weight"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              体重
            </button>
          )}
        </div>
        {gender && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showStandard}
              onChange={(e) => setShowStandard(e.target.checked)}
              className="rounded"
            />
            標準曲線
          </label>
        )}
      </div>

      {/* グラフ */}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="monthAge"
              tick={{ fontSize: compact ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              label={
                compact
                  ? undefined
                  : { value: "月齢", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }
              }
            />
            <YAxis
              tick={{ fontSize: compact ? 9 : 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              unit={unit}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<GrowthTooltip tab={tab} />} />

            {/* 標準曲線帯 */}
            {showStandard && (
              <>
                <Area
                  dataKey="p97"
                  stroke="none"
                  fill={`rgba(${bandColor}, 0.1)`}
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Area
                  dataKey="p3"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="p50"
                  stroke={`rgba(${bandColor}, 0.5)`}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="p3"
                  stroke={`rgba(${bandColor}, 0.3)`}
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="p97"
                  stroke={`rgba(${bandColor}, 0.3)`}
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* 自分のデータ */}
            <Line
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              connectNulls
              isAnimationActive={false}
            />
            <Scatter
              dataKey="value"
              fill="hsl(var(--primary))"
              r={compact ? 3 : 4}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
