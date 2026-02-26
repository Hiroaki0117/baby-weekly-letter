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
import type { MoodEntry } from "@/lib/stats";

const MOOD_CONFIG = [
  { key: "moved", emoji: "🥰", label: "感動", color: "#f472b6" },
  { key: "happy", emoji: "🙂", label: "嬉しい", color: "#fbbf24" },
  { key: "neutral", emoji: "😐", label: "普通", color: "#94a3b8" },
  { key: "tired", emoji: "😴", label: "疲れた", color: "#818cf8" },
  { key: "sad", emoji: "😭", label: "悲しい", color: "#60a5fa" },
] as const;

type Props = {
  data: MoodEntry[];
  scrollable?: boolean;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; fill?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => (p.value ?? 0) > 0);
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {items.map((item) => {
        const config = MOOD_CONFIG.find((m) => m.key === item.dataKey);
        return (
          <div key={item.dataKey} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-muted-foreground">
              {config ? `${config.emoji} ${config.label}` : item.dataKey}
            </span>
            <span className="ml-auto font-semibold text-foreground">{item.value}件</span>
          </div>
        );
      })}
    </div>
  );
}

export function MoodChart({ data, scrollable }: Props) {
  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.1)" }} />
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

  return (
    <div className="space-y-3">
      {/* 凡例（グラフ上部） */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {MOOD_CONFIG.map((mood) => (
          <div key={mood.key} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: mood.color }}
            />
            <span className="text-xs text-muted-foreground">
              {mood.emoji} {mood.label}
            </span>
          </div>
        ))}
      </div>

      {scrollable ? (
        <div className="overflow-x-auto">
          <div className="h-56 min-w-[480px]">{chart}</div>
        </div>
      ) : (
        <div className="h-56">{chart}</div>
      )}
    </div>
  );
}
