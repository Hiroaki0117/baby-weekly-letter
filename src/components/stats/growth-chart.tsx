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
  hP3?: number;
  hP97?: number;
  hP50?: number;
  wP3?: number;
  wP97?: number;
  wP50?: number;
};

/**
 * 標準曲線データを線形補間して任意の月齢の値を返す
 */
function interpolateStandard(
  data: GrowthStandard[],
  monthAge: number
): { p3: number; p50: number; p97: number } | null {
  if (data.length === 0) return null;
  if (monthAge < data[0].monthAge || monthAge > data[data.length - 1].monthAge) return null;

  // ぴったり一致
  const exact = data.find((d) => d.monthAge === monthAge);
  if (exact) return { p3: exact.p3, p50: exact.p50, p97: exact.p97 };

  // 補間
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].monthAge <= monthAge && monthAge <= data[i + 1].monthAge) {
      const ratio =
        (monthAge - data[i].monthAge) / (data[i + 1].monthAge - data[i].monthAge);
      return {
        p3: Math.round((data[i].p3 + (data[i + 1].p3 - data[i].p3) * ratio) * 10) / 10,
        p50: Math.round((data[i].p50 + (data[i + 1].p50 - data[i].p50) * ratio) * 10) / 10,
        p97: Math.round((data[i].p97 + (data[i + 1].p97 - data[i].p97) * ratio) * 10) / 10,
      };
    }
  }
  return null;
}

function getDefaultTab(birthDate: string): number {
  const months = differenceInMonths(new Date(), parseISO(birthDate));
  for (let i = 0; i < AGE_TABS.length; i++) {
    if (months <= AGE_TABS[i].maxMonth) return i;
  }
  return AGE_TABS.length - 1;
}

/**
 * X軸の刻み間隔を返す
 */
function getTickInterval(maxMonth: number): number {
  if (maxMonth <= 12) return 1;
  if (maxMonth <= 24) return 2;
  if (maxMonth <= 48) return 4;
  if (maxMonth <= 96) return 6;
  return 12;
}

function buildChartData(
  records: GrowthRecord[],
  birthDate: string,
  maxMonth: number,
  showStandard: boolean,
  gender: Gender | null
): ChartDataPoint[] {
  const heightStd: GrowthStandard[] =
    showStandard && gender
      ? gender === "male" ? maleHeight : femaleHeight
      : [];
  const weightStd: GrowthStandard[] =
    showStandard && gender
      ? gender === "male" ? maleWeight : femaleWeight
      : [];

  // 自分のデータ
  const myHeightMap = new Map<number, number>();
  const myWeightMap = new Map<number, number>();
  for (const r of records) {
    const ma = calcMonthAge(birthDate, r.measured_date);
    if (ma > maxMonth) continue;
    if (r.height_cm != null) myHeightMap.set(ma, r.height_cm);
    if (r.weight_kg != null) myWeightMap.set(ma, r.weight_kg);
  }

  // 標準曲線用: 範囲内の全ポイントを生成（刻み間隔で）
  const allMonths = new Set<number>();

  // 標準曲線のデータポイントを追加（72ヶ月以内かつmaxMonth以内）
  const stdMaxMonth = Math.min(maxMonth, 72);
  if (showStandard && gender) {
    const interval = getTickInterval(maxMonth);
    for (let m = 0; m <= stdMaxMonth; m += interval) {
      allMonths.add(m);
    }
    // 標準曲線の元データポイントも追加
    heightStd
      .filter((s) => s.monthAge <= maxMonth)
      .forEach((s) => allMonths.add(s.monthAge));
  }

  // 自分のデータポイントを追加
  myHeightMap.forEach((_, ma) => allMonths.add(ma));
  myWeightMap.forEach((_, ma) => allMonths.add(ma));

  // データが少ない場合のフォールバック
  if (allMonths.size === 0) return [];

  return Array.from(allMonths)
    .sort((a, b) => a - b)
    .map((monthAge) => {
      const hStd = showStandard ? interpolateStandard(heightStd, monthAge) : null;
      const wStd = showStandard ? interpolateStandard(weightStd, monthAge) : null;
      return {
        monthAge,
        height: myHeightMap.get(monthAge) ?? null,
        weight: myWeightMap.get(monthAge) ?? null,
        hP3: hStd?.p3,
        hP50: hStd?.p50,
        hP97: hStd?.p97,
        wP3: wStd?.p3,
        wP50: wStd?.p50,
        wP97: wStd?.p97,
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
  const tickInterval = getTickInterval(maxMonth);

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

  const chartHeight = compact ? 220 : 420;

  // X軸ティック生成
  const xTicks: number[] = [];
  for (let m = 0; m <= maxMonth; m += tickInterval) {
    xTicks.push(m);
  }

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
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="monthAge"
              type="number"
              domain={[0, maxMonth]}
              ticks={xTicks}
              tick={{ fontSize: compact ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}`}
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
              domain={["dataMin - 5", "dataMax + 5"]}
              tickCount={compact ? 6 : 10}
            />
            {/* 右Y軸: 体重 */}
            <YAxis
              yAxisId="weight"
              orientation="right"
              tick={{ fontSize: compact ? 9 : 10, fill: `rgba(${WEIGHT_COLOR}, 0.7)` }}
              tickLine={false}
              axisLine={false}
              unit="kg"
              domain={["dataMin - 1", "dataMax + 2"]}
              tickCount={compact ? 6 : 10}
            />
            <Tooltip content={<GrowthTooltip />} />

            {/* 身長の標準曲線帯（p3〜p97） */}
            {showStandard && heightStdVisible(data) && (
              <>
                <Area
                  yAxisId="height"
                  dataKey="hP97"
                  stroke="none"
                  fill={`rgba(${HEIGHT_COLOR}, 0.12)`}
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Area
                  yAxisId="height"
                  dataKey="hP3"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Line
                  yAxisId="height"
                  dataKey="hP50"
                  stroke={`rgba(${HEIGHT_COLOR}, 0.4)`}
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </>
            )}

            {/* 体重の標準曲線帯（p3〜p97） */}
            {showStandard && weightStdVisible(data) && (
              <>
                <Area
                  yAxisId="weight"
                  dataKey="wP97"
                  stroke="none"
                  fill={`rgba(${WEIGHT_COLOR}, 0.12)`}
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Area
                  yAxisId="weight"
                  dataKey="wP3"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Line
                  yAxisId="weight"
                  dataKey="wP50"
                  stroke={`rgba(${WEIGHT_COLOR}, 0.4)`}
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
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
                dot={{ r: compact ? 3 : 4, fill: `rgb(${HEIGHT_COLOR})` }}
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
                dot={{ r: compact ? 3 : 4, fill: `rgb(${WEIGHT_COLOR})` }}
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

/** 身長標準曲線のデータが存在するか */
function heightStdVisible(data: ChartDataPoint[]): boolean {
  return data.some((d) => d.hP3 != null);
}

/** 体重標準曲線のデータが存在するか */
function weightStdVisible(data: ChartDataPoint[]): boolean {
  return data.some((d) => d.wP3 != null);
}
