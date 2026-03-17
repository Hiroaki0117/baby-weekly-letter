"use client";

import { RecordList } from "@/components/ui/record-list";
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
  return (
    <RecordList
      records={records}
      emptyMessage="まだ睡眠記録がありません"
      onEdit={onEdit}
      onDelete={onDelete}
      renderContent={(record) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            {formatTime(record.started_at)} → {formatTime(record.ended_at)}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatDuration(record.duration_minutes)}
          </p>
        </div>
      )}
    />
  );
}
