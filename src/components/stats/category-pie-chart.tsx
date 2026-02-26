"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { CategoryCount } from "@/lib/stats";

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

type Props = {
  data: CategoryCount[];
};

export function CategoryPieChart({ data }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">カテゴリ別の記録</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="45%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={2}
              label={({ name, value }: { name?: string; value?: number }) =>
                `${name ?? ""} (${value ?? 0})`
              }
              labelLine={{ strokeWidth: 1 }}
            >
              {data.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number | undefined) => [`${value ?? 0}件`]}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
