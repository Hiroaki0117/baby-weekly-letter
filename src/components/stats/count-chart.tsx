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
    <div className="rounded-lg border border-orange-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-sm font-bold text-orange-500">{payload[0].value ?? 0}件</p>
    </div>
  );
}

export function CountChart({ data, scrollable }: Props) {
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(251, 146, 60, 0.08)" }} />
        <Bar
          dataKey="count"
          fill="#fb923c"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  if (scrollable) {
    return (
      <div className="overflow-x-auto">
        <div className="h-56 min-w-[480px] rounded-lg bg-white">{chart}</div>
      </div>
    );
  }

  return <div className="h-56 rounded-lg bg-white">{chart}</div>;
}
