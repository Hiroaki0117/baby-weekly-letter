"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { TemperatureRecord } from "@/types";

type Props = {
  records: TemperatureRecord[];
  onEdit: (record: TemperatureRecord) => void;
  onDelete: (id: string) => void;
};

function formatMeasuredAt(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TemperatureRecordList({ records, onEdit, onDelete }: Props) {
  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        まだ体温記録がありません
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/30">
      {[...records].reverse().map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between py-3"
        >
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              {formatMeasuredAt(record.measured_at)}
            </p>
            <p className={`text-sm font-semibold ${record.temperature >= 37.5 ? "text-red-500" : "text-foreground"}`}>
              {record.temperature}℃
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(record)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="編集"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="削除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
