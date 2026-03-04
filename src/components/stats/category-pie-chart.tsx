"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "@/types";
import type { CategoryCount, PeriodType } from "@/lib/stats";

const COLORS = [
  "#f472b6", // ピンク
  "#fbbf24", // イエロー
  "#34d399", // グリーン
  "#60a5fa", // ブルー
  "#818cf8", // パープル
  "#fb923c", // オレンジ
  "#94a3b8", // グレー
  "#f87171", // レッド
];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: { category?: string; fill?: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <div className="flex items-center gap-2 text-xs">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: item.payload?.fill }}
        />
        <span className="font-semibold text-foreground">{item.payload?.category}</span>
        <span className="ml-auto font-bold text-foreground">{item.value}件</span>
      </div>
    </div>
  );
}

type Props = {
  data: CategoryCount[];
  period?: PeriodType;
  selectedMonth?: number;
  onChangeMonth?: (month: number) => void;
};

export function CategoryPieChart({ data, period, selectedMonth, onChangeMonth }: Props) {
  // 全カテゴリを含め、件数降順でソート
  const dataMap = new Map(data.map((d) => [d.category, d.count]));
  const full = CATEGORY_OPTIONS.map((c) => ({
    category: c.label,
    count: dataMap.get(c.label) ?? 0,
  }));
  const sorted = full.sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">カテゴリ別の記録</h3>

      {/* 月セレクター（月別タブ時のみ表示） */}
      {period === "monthly" && onChangeMonth && (
        <div className="flex flex-wrap gap-1">
          {MONTHS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChangeMonth(m)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                selectedMonth === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {m}月
            </button>
          ))}
        </div>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {sorted.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
