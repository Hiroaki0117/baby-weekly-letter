"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemperatureRecord } from "@/types";

type Props = {
  editingRecord?: TemperatureRecord | null;
  onSubmit: (data: {
    measured_at: string;
    temperature: number;
  }) => Promise<void>;
  onCancel: () => void;
};

export function TemperatureRecordForm({ editingRecord, onSubmit, onCancel }: Props) {
  const [measuredAt, setMeasuredAt] = useState(
    editingRecord
      ? format(new Date(editingRecord.measured_at), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [tempStr, setTempStr] = useState(
    editingRecord ? String(editingRecord.temperature) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!measuredAt) {
      setError("計測日時を入力してください");
      return;
    }

    const temp = tempStr ? parseFloat(tempStr) : NaN;
    if (isNaN(temp)) {
      setError("体温を入力してください");
      return;
    }
    if (temp < 34.0 || temp > 42.0) {
      setError("体温は34.0〜42.0℃の範囲で入力してください");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        measured_at: new Date(measuredAt).toISOString(),
        temperature: temp,
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
          計測日時
        </Label>
        <Input
          type="datetime-local"
          value={measuredAt}
          onChange={(e) => setMeasuredAt(e.target.value)}
          className="border-border/60 bg-background/60 focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          体温 (℃)
        </Label>
        <Input
          type="number"
          step="0.1"
          placeholder="例: 36.5"
          value={tempStr}
          onChange={(e) => setTempStr(e.target.value)}
          className="border-border/60 bg-background/60 focus:border-primary/50"
        />
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
