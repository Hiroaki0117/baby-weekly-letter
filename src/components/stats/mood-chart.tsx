"use client";

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
import type { MoodEntry } from "@/lib/stats";

const MOOD_CONFIG = [
  { key: "moved", label: "🥰 感動", color: "#f472b6" },
  { key: "happy", label: "🙂 嬉しい", color: "#fbbf24" },
  { key: "neutral", label: "😐 普通", color: "#94a3b8" },
  { key: "tired", label: "😴 疲れた", color: "#818cf8" },
  { key: "sad", label: "😭 悲しい", color: "#60a5fa" },
] as const;

type Props = {
  data: MoodEntry[];
  scrollable?: boolean;
};

export function MoodChart({ data, scrollable }: Props) {
  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: number | undefined, name: string | undefined) => {
            const config = MOOD_CONFIG.find((m) => m.key === name);
            return [`${value ?? 0}件`, config?.label ?? name ?? ""];
          }}
        />
        <Legend
          formatter={(value: string) => {
            const config = MOOD_CONFIG.find((m) => m.key === value);
            return <span className="text-[10px]">{config?.label ?? value}</span>;
          }}
        />
        {MOOD_CONFIG.map((mood) => (
          <Bar
            key={mood.key}
            dataKey={mood.key}
            stackId="mood"
            fill={mood.color}
            radius={mood.key === "sad" ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  if (scrollable) {
    return (
      <div className="overflow-x-auto">
        <div className="h-56 min-w-[480px]">{chart}</div>
      </div>
    );
  }

  return <div className="h-56">{chart}</div>;
}
