"use client";

import { format, parseISO } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import type { GrowthRecord } from "@/types";

type Props = {
  records: GrowthRecord[];
  onEdit: (record: GrowthRecord) => void;
  onDelete: (id: string) => void;
};

export function GrowthRecordList({ records, onEdit, onDelete }: Props) {
  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        まだ成長記録がありません
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
