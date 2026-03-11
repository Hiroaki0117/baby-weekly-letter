"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { SleepRecord } from "@/types";

type Props = {
  records: SleepRecord[];
  onEdit: (record: SleepRecord) => void;
  onDelete: (id: string) => void;
};

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}時間${m}分`;
  if (h > 0) return `${h}時間`;
  return `${m}分`;
}

export function SleepRecordList({ records, onEdit, onDelete }: Props) {
  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        まだ睡眠記録がありません
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
              {formatTime(record.started_at)} → {formatTime(record.ended_at)}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatDuration(record.duration_minutes)}
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
