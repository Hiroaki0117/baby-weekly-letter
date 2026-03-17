"use client";

import { RecordList } from "@/components/ui/record-list";
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
  return (
    <RecordList
      records={records}
      emptyMessage="まだ体温記録がありません"
      onEdit={onEdit}
      onDelete={onDelete}
      renderContent={(record) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            {formatMeasuredAt(record.measured_at)}
          </p>
          <p className={`text-sm font-semibold ${record.temperature >= 37.5 ? "text-red-500" : "text-foreground"}`}>
            {record.temperature}℃
          </p>
        </div>
      )}
    />
  );
}
