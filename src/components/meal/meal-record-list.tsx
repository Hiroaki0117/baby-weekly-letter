"use client";

import { Pencil, Trash2 } from "lucide-react";
import { MEAL_TYPE_OPTIONS, MEAL_AMOUNT_OPTIONS, type MealRecord } from "@/types";

type Props = {
  records: MealRecord[];
  onEdit: (record: MealRecord) => void;
  onDelete: (id: string) => void;
};

function getMealTypeLabel(type: string): string {
  return MEAL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function getMealAmountLabel(amount: string): string {
  return MEAL_AMOUNT_OPTIONS.find((o) => o.value === amount)?.label ?? amount;
}

export function MealRecordList({ records, onEdit, onDelete }: Props) {
  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        まだ食事記録がありません
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
              {getMealTypeLabel(record.meal_type)}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {getMealAmountLabel(record.amount)}
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
