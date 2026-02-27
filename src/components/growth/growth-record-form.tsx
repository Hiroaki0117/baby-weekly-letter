"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GrowthRecord } from "@/types";

type Props = {
  editingRecord?: GrowthRecord | null;
  onSubmit: (data: {
    measured_date: string;
    height_cm: number | null;
    weight_kg: number | null;
  }) => Promise<void>;
  onCancel: () => void;
};

export function GrowthRecordForm({ editingRecord, onSubmit, onCancel }: Props) {
  const [measuredDate, setMeasuredDate] = useState(
    editingRecord?.measured_date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [heightStr, setHeightStr] = useState(
    editingRecord?.height_cm != null ? String(editingRecord.height_cm) : ""
  );
  const [weightStr, setWeightStr] = useState(
    editingRecord?.weight_kg != null ? String(editingRecord.weight_kg) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const heightCm = heightStr ? parseFloat(heightStr) : null;
    const weightKg = weightStr ? parseFloat(weightStr) : null;

    if (heightCm === null && weightKg === null) {
      setError("身長か体重のいずれかを入力してください");
      return;
    }
    if (heightCm !== null && (heightCm < 20 || heightCm > 200)) {
      setError("身長は20〜200cmの範囲で入力してください");
      return;
    }
    if (weightKg !== null && (weightKg < 0.5 || weightKg > 100)) {
      setError("体重は0.5〜100kgの範囲で入力してください");
      return;
    }
    if (!measuredDate) {
      setError("計測日を入力してください");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        measured_date: measuredDate,
        height_cm: heightCm,
        weight_kg: weightKg,
      });
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
          計測日
        </Label>
        <Input
          type="date"
          value={measuredDate}
          onChange={(e) => setMeasuredDate(e.target.value)}
          className="border-border/60 bg-background/60 focus:border-primary/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            身長 (cm)
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="例: 65.5"
            value={heightStr}
            onChange={(e) => setHeightStr(e.target.value)}
            className="border-border/60 bg-background/60 focus:border-primary/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            体重 (kg)
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="例: 7.25"
            value={weightStr}
            onChange={(e) => setWeightStr(e.target.value)}
            className="border-border/60 bg-background/60 focus:border-primary/50"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "保存中..." : editingRecord ? "更新" : "追加"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
        >
          取消
        </button>
      </div>
    </form>
  );
}
