"use client";

import { format, parseISO } from "date-fns";
import { RecordList } from "@/components/ui/record-list";
import type { GrowthRecord } from "@/types";

type Props = {
  records: GrowthRecord[];
  onEdit: (record: GrowthRecord) => void;
  onDelete: (id: string) => void;
};

export function GrowthRecordList({ records, onEdit, onDelete }: Props) {
  return (
    <RecordList
      records={records}
      emptyMessage="まだ成長記録がありません"
      onEdit={onEdit}
      onDelete={onDelete}
      renderContent={(record) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            {format(parseISO(record.measured_date), "yyyy/M/d")}
          </p>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {record.height_cm != null && (
              <span>身長 {record.height_cm}cm</span>
            )}
            {record.weight_kg != null && (
              <span>体重 {record.weight_kg}kg</span>
            )}
          </div>
        </div>
      )}
    />
  );
}
