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
} from "recharts";
import { differenceInMonths, parseISO } from "date-fns";
import { calcMonthAge } from "@/lib/growth";
import {
  maleHeight,
  maleWeight,
  femaleHeight,
  femaleWeight,
} from "@/lib/growth-standards";
import type { GrowthStandard } from "@/lib/growth-standards";
import type { GrowthRecord, Gender } from "@/types";

type Props = {
  records: GrowthRecord[];
  birthDate: string;
  gender: Gender | null;
  compact?: boolean;
};

const AGE_TABS = [
  { label: "1歳", maxMonth: 12 },
  { label: "2歳", maxMonth: 24 },
  { label: "4歳", maxMonth: 48 },
  { label: "8歳", maxMonth: 96 },
  { label: "12歳", maxMonth: 144 },
] as const;

// 色定義
const HEIGHT_COLOR = "59, 130, 246"; // blue-500
const WEIGHT_COLOR = "34, 197, 94"; // green-500

type ChartDataPoint = {
  monthAge: number;
  height: number | null;
  weight: number | null;
  // 身長標準曲線
  hP3?: number;
  hP50?: number;
  hP97?: number;
  // 体重標準曲線
  wP3?: number;
  wP50?: number;
  wP97?: number;
};

function getDefaultTab(birthDate: string): number {
  const months = differenceInMonths(new Date(), parseISO(birthDate));
  for (let i = 0; i < AGE_TABS.length; i++) {
    if (months <= AGE_TABS[i].maxMonth) return i;
  }
  return AGE_TABS.length - 1;
}

function buildChartData(
  records: GrowthRecord[],
  birthDate: string,
  maxMonth: number,
  showStandard: boolean,
  gender: Gender | null
): ChartDataPoint[] {
  // 標準曲線
  const heightStd: GrowthStandard[] =
    showStandard && gender
      ? gender === "male" ? maleHeight : femaleHeight
      : [];
  const weightStd: GrowthStandard[] =
    showStandard && gender
      ? gender === "male" ? maleWeight : femaleWeight
      : [];

  const hMap = new Map(heightStd.map((s) => [s.monthAge, s]));
  const wMap = new Map(weightStd.map((s) => [s.monthAge, s]));

  // 自分のデータ
  const myHeightMap = new Map<number, number>();
  const myWeightMap = new Map<number, number>();
  for (const r of records) {
    const ma = calcMonthAge(birthDate, r.measured_date);
    if (ma > maxMonth) continue;
    if (r.height_cm != null) myHeightMap.set(ma, r.height_cm);
    if (r.weight_kg != null) myWeightMap.set(ma, r.weight_kg);
  }

  // 全月齢を集める
  const allMonths = new Set<number>();
  heightStd.filter((s) => s.monthAge <= maxMonth).forEach((s) => allMonths.add(s.monthAge));
  weightStd.filter((s) => s.monthAge <= maxMonth).forEach((s) => allMonths.add(s.monthAge));
  myHeightMap.forEach((_, ma) => allMonths.add(ma));
  myWeightMap.forEach((_, ma) => allMonths.add(ma));

  return Array.from(allMonths)
    .sort((a, b) => a - b)
    .map((monthAge) => {
      const h = hMap.get(monthAge);
      const w = wMap.get(monthAge);
      return {
        monthAge,
        height: myHeightMap.get(monthAge) ?? null,
        weight: myWeightMap.get(monthAge) ?? null,
        hP3: h?.p3,
        hP50: h?.p50,
        hP97: h?.p97,
        wP3: w?.p3,
        wP50: w?.p50,
        wP97: w?.p97,
      };
    });
}

function GrowthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; payload?: ChartDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-foreground">
        {point.monthAge}ヶ月
      </p>
      {point.height !== null && (
        <p className="text-xs" style={{ color: `rgb(${HEIGHT_COLOR})` }}>
          身長: <span className="font-semibold">{point.height}cm</span>
          {point.hP50 != null && (
            <span className="ml-1 text-muted-foreground">(標準 {point.hP50}cm)</span>
          )}
        </p>
      )}
      {point.weight !== null && (
        <p className="text-xs" style={{ color: `rgb(${WEIGHT_COLOR})` }}>
          体重: <span className="font-semibold">{point.weight}kg</span>
          {point.wP50 != null && (
            <span className="ml-1 text-muted-foreground">(標準 {point.wP50}kg)</span>
          )}
        </p>
      )}
    </div>
  );
}

export function GrowthChart({ records, birthDate, gender, compact }: Props) {
  const [tabIndex, setTabIndex] = useState(() => getDefaultTab(birthDate));
  const defaultShowStandard = gender !== null;
  const [showStandard, setShowStandard] = useState(defaultShowStandard);

  const maxMonth = AGE_TABS[tabIndex].maxMonth;

  const data = useMemo(
    () => buildChartData(records, birthDate, maxMonth, showStandard, gender),
    [records, birthDate, maxMonth, showStandard, gender]
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

  const chartHeight = compact ? 200 : 300;

  return (
    <div className="space-y-3">
      {/* 年齢範囲タブ + 標準曲線トグル */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {AGE_TABS.map((t, i) => (
            <button
              key={t.maxMonth}
              onClick={() => setTabIndex(i)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                tabIndex === i
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {gender && (
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
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

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4">
        {hasHeight && (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: `rgb(${HEIGHT_COLOR})` }}
            />
            <span className="text-xs text-muted-foreground">身長 (cm)</span>
          </div>
        )}
        {hasWeight && (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: `rgb(${WEIGHT_COLOR})` }}
            />
            <span className="text-xs text-muted-foreground">体重 (kg)</span>
          </div>
        )}
      </div>

      {/* グラフ */}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
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
              domain={[0, maxMonth]}
              type="number"
              label={
                compact
                  ? undefined
                  : { value: "月齢", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }
              }
            />
            {/* 左Y軸: 身長 */}
            <YAxis
              yAxisId="height"
              orientation="left"
              tick={{ fontSize: compact ? 9 : 10, fill: `rgba(${HEIGHT_COLOR}, 0.7)` }}
              tickLine={false}
              axisLine={false}
              unit="cm"
              domain={["auto", "auto"]}
            />
            {/* 右Y軸: 体重 */}
            <YAxis
              yAxisId="weight"
              orientation="right"
              tick={{ fontSize: compact ? 9 : 10, fill: `rgba(${WEIGHT_COLOR}, 0.7)` }}
              tickLine={false}
              axisLine={false}
              unit="kg"
              domain={["auto", "auto"]}
            />
            <Tooltip content={<GrowthTooltip />} />

            {/* 身長の標準曲線帯 */}
            {showStandard && (
              <>
                <Area
                  yAxisId="height"
                  dataKey="hP97"
                  stroke="none"
                  fill={`rgba(${HEIGHT_COLOR}, 0.06)`}
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Area
                  yAxisId="height"
                  dataKey="hP3"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="height"
                  dataKey="hP50"
                  stroke={`rgba(${HEIGHT_COLOR}, 0.25)`}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* 体重の標準曲線帯 */}
            {showStandard && (
              <>
                <Area
                  yAxisId="weight"
                  dataKey="wP97"
                  stroke="none"
                  fill={`rgba(${WEIGHT_COLOR}, 0.06)`}
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Area
                  yAxisId="weight"
                  dataKey="wP3"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="weight"
                  dataKey="wP50"
                  stroke={`rgba(${WEIGHT_COLOR}, 0.25)`}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* 身長の折れ線 */}
            {hasHeight && (
              <Line
                yAxisId="height"
                dataKey="height"
                stroke={`rgb(${HEIGHT_COLOR})`}
                strokeWidth={2}
                dot={{ r: compact ? 2.5 : 3.5, fill: `rgb(${HEIGHT_COLOR})` }}
                connectNulls
                isAnimationActive={false}
              />
            )}

            {/* 体重の折れ線 */}
            {hasWeight && (
              <Line
                yAxisId="weight"
                dataKey="weight"
                stroke={`rgb(${WEIGHT_COLOR})`}
                strokeWidth={2}
                dot={{ r: compact ? 2.5 : 3.5, fill: `rgb(${WEIGHT_COLOR})` }}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
