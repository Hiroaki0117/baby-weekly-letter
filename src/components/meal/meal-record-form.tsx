"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormActions } from "@/components/ui/form-actions";
import {
  MEAL_TYPE_OPTIONS,
  MEAL_AMOUNT_OPTIONS,
  type MealRecord,
  type MealType,
  type MealAmount,
} from "@/types";

type Props = {
  editingRecord?: MealRecord | null;
  defaultDate?: string;
  onSubmit: (data: {
    meal_date: string;
    meal_type: MealType;
    amount: MealAmount;
  }) => Promise<void>;
  onCancel: () => void;
};

export function MealRecordForm({ editingRecord, defaultDate, onSubmit, onCancel }: Props) {
  const [mealDate, setMealDate] = useState(
    editingRecord
      ? editingRecord.meal_date
      : defaultDate ?? format(new Date(), "yyyy-MM-dd"),
  );
  const [mealType, setMealType] = useState<MealType | "">(
    editingRecord ? (editingRecord.meal_type as MealType) : "",
  );
  const [amount, setAmount] = useState<MealAmount | "">(
    editingRecord ? (editingRecord.amount as MealAmount) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!mealDate) {
      setError("日付を入力してください");
      return;
    }
    if (!mealType) {
      setError("食事種別を選択してください");
      return;
    }
    if (!amount) {
      setError("量を選択してください");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ meal_date: mealDate, meal_type: mealType, amount });
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          日付
        </Label>
        <Input
          type="date"
          value={mealDate}
          onChange={(e) => setMealDate(e.target.value)}
          className="border-border/60 bg-background/60 focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          食事種別
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMealType(opt.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                mealType === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          量
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_AMOUNT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAmount(opt.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                amount === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <FormActions saving={saving} isEditing={!!editingRecord} onCancel={onCancel} />
    </form>
  );
}
