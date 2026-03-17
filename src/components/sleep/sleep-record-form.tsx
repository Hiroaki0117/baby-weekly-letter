"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormActions } from "@/components/ui/form-actions";
import type { SleepRecord } from "@/types";

type Props = {
  editingRecord?: SleepRecord | null;
  defaultDate?: string;
  onSubmit: (data: {
    sleep_date: string;
    startTime: string;
    endTime: string;
  }) => Promise<void>;
  onCancel: () => void;
};

function extractTime(isoStr: string): string {
  return format(new Date(isoStr), "HH:mm");
}

function calcPreview(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}時間${mins}分`;
  if (hours > 0) return `${hours}時間`;
  return `${mins}分`;
}

export function SleepRecordForm({ editingRecord, defaultDate, onSubmit, onCancel }: Props) {
  const [sleepDate, setSleepDate] = useState(
    editingRecord
      ? editingRecord.sleep_date
      : defaultDate ?? format(new Date(), "yyyy-MM-dd"),
  );
  const [startTime, setStartTime] = useState(
    editingRecord ? extractTime(editingRecord.started_at) : "",
  );
  const [endTime, setEndTime] = useState(
    editingRecord ? extractTime(editingRecord.ended_at) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = calcPreview(startTime, endTime);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sleepDate) {
      setError("日付を入力してください");
      return;
    }
    if (!startTime || !endTime) {
      setError("就寝時刻と起床時刻を入力してください");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ sleep_date: sleepDate, startTime, endTime });
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
          value={sleepDate}
          onChange={(e) => setSleepDate(e.target.value)}
          className="border-border/60 bg-background/60 focus:border-primary/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            就寝時刻
          </Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border-border/60 bg-background/60 focus:border-primary/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            起床時刻
          </Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border-border/60 bg-background/60 focus:border-primary/50"
          />
        </div>
      </div>

      {preview && (
        <p className="text-sm text-muted-foreground">
          睡眠時間: <span className="font-medium text-foreground">{preview}</span>
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <FormActions saving={saving} isEditing={!!editingRecord} onCancel={onCancel} />
    </form>
  );
}
