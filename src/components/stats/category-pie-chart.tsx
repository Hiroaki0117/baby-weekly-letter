"use client";

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
import { CATEGORY_OPTIONS } from "@/types";
import type { CategoryCount, PeriodType } from "@/lib/stats";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type ChartEntry = {
  category: string;
  records: number;
  milestones: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; payload?: ChartEntry }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  const total = entry.records + entry.milestones;

  return (
    <div className="rounded-lg border border-border/60 bg-white px-3 py-2 shadow-md">
      <div className="mb-1 text-xs font-semibold text-foreground">{entry.category}</div>
      <div className="space-y-0.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/70" />
          <span className="text-muted-foreground">記録</span>
          <span className="ml-auto font-semibold text-foreground">{entry.records}件</span>
        </div>
        {entry.milestones > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span className="text-muted-foreground">初めて</span>
            <span className="ml-auto font-semibold text-foreground">{entry.milestones}件</span>
          </div>
        )}
        <div className="border-t border-border/40 pt-0.5 flex justify-between">
          <span className="text-muted-foreground">合計</span>
          <span className="font-bold text-foreground">{total}件</span>
        </div>
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
  const dataMap = new Map(data.map((d) => [d.category, d]));
  const full: ChartEntry[] = CATEGORY_OPTIONS.map((c) => {
    const entry = dataMap.get(c.label);
    return {
      category: c.label,
      records: (entry?.count ?? 0) - (entry?.milestoneCount ?? 0),
      milestones: entry?.milestoneCount ?? 0,
    };
  });
  const sorted = full.sort((a, b) => (b.records + b.milestones) - (a.records + a.milestones));

  const hasMilestones = sorted.some((d) => d.milestones > 0);

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

      {/* 凡例 */}
      {hasMilestones && (
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/70" />
            <span className="text-xs text-muted-foreground">記録</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span className="text-xs text-muted-foreground">初めての出来事</span>
          </div>
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
            <Bar
              dataKey="records"
              stackId="category"
              fill="hsl(var(--primary) / 0.7)"
              barSize={20}
            />
            <Bar
              dataKey="milestones"
              stackId="category"
              fill="#fbbf24"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
