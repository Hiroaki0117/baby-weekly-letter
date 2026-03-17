"use client";

import { RecordList } from "@/components/ui/record-list";
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
  return (
    <RecordList
      records={records}
      emptyMessage="まだ食事記録がありません"
      onEdit={onEdit}
      onDelete={onDelete}
      renderContent={(record) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            {getMealTypeLabel(record.meal_type)}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {getMealAmountLabel(record.amount)}
          </p>
        </div>
      )}
    />
  );
}
