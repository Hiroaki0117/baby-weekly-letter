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
import type { CountEntry } from "@/lib/stats";

type Props = {
  data: CountEntry[];
  scrollable?: boolean;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value ?? 0}件</p>
    </div>
  );
}

export function CountChart({ data, scrollable }: Props) {
  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} fill="hsl(var(--primary) / 0.05)" />
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} />
        <Bar
          dataKey="count"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
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
