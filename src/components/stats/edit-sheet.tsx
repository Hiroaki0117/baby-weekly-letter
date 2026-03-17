"use client";

import { useEffect, useCallback, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEAL_TYPE_OPTIONS, MEAL_AMOUNT_OPTIONS, TEMP_PERIOD_DEFAULT_HOUR, SLEEP_DEFAULT_TIMES } from "@/types";
import type { TemperatureRecord, SleepRecord, MealRecord, TempPeriod, SleepCategory, MealType } from "@/types";

// ===== 体温 =====

type TempEditProps = {
  record: TemperatureRecord;
  onSave: (id: string, data: { temperature: number; measured_at: string }) => void;
  onClose: () => void;
};

function toLocalDatetimeValue(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TempEditSheet({ record, onSave, onClose }: TempEditProps) {
  const [temperature, setTemperature] = useState(String(record.temperature));
  const [measuredAt, setMeasuredAt] = useState(toLocalDatetimeValue(record.measured_at));
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 34 || temp > 42) return;
    setSaving(true);
    try {
      onSave(record.id, {
        temperature: temp,
        measured_at: new Date(measuredAt).toISOString(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetWrapper title="体温を編集" onClose={onClose}>
      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">体温 (℃)</span>
          <input
            type="number"
            step="0.1"
            min="34"
            max="42"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">計測日時</span>
          <input
            type="datetime-local"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
      </div>
      <SheetFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} />
    </SheetWrapper>
  );
}

// ===== 睡眠 =====

type SleepEditProps = {
  record: SleepRecord;
  onSave: (id: string, data: { started_at: string; ended_at: string }) => void;
  onClose: () => void;
};

function toTimeValue(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function SleepEditSheet({ record, onSave, onClose }: SleepEditProps) {
  const [startTime, setStartTime] = useState(toTimeValue(record.started_at));
  const [endTime, setEndTime] = useState(toTimeValue(record.ended_at));
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      // sleep_date + time → ISO 8601
      const baseDate = record.sleep_date;
      const startISO = new Date(`${baseDate}T${startTime}:00`).toISOString();
      let endISO = new Date(`${baseDate}T${endTime}:00`).toISOString();
      // 日跨ぎ: 終了が開始より前なら翌日
      if (endTime <= startTime) {
        const nextDay = new Date(`${baseDate}T${endTime}:00`);
        nextDay.setDate(nextDay.getDate() + 1);
        endISO = nextDay.toISOString();
      }
      onSave(record.id, { started_at: startISO, ended_at: endISO });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetWrapper title="睡眠を編集" onClose={onClose}>
      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">開始時刻</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">終了時刻</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
      </div>
      <SheetFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} />
    </SheetWrapper>
  );
}

// ===== 食事 =====


type MealEditProps = {
  record: MealRecord;
  onSave: (id: string, data: { amount: string }) => void;
  onClose: () => void;
};

export function MealEditSheet({ record, onSave, onClose }: MealEditProps) {
  const [amount, setAmount] = useState(record.amount);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      onSave(record.id, { amount });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetWrapper title="食事を編集" onClose={onClose}>
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">食事量</span>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_AMOUNT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAmount(opt.value)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                amount === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <SheetFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} />
    </SheetWrapper>
  );
}

// ===== 体温 新規追加 =====


type TempAddProps = {
  dateStr: string;
  period: TempPeriod;
  onCreate: (data: { temperature: number; measured_at: string }) => void;
  onClose: () => void;
};

export function TempAddSheet({ dateStr, period, onCreate, onClose }: TempAddProps) {
  const defaultHour = TEMP_PERIOD_DEFAULT_HOUR[period];
  const defaultDatetime = `${dateStr}T${String(defaultHour).padStart(2, "0")}:00`;
  const [temperature, setTemperature] = useState("36.5");
  const [measuredAt, setMeasuredAt] = useState(defaultDatetime);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 34 || temp > 42) return;
    setSaving(true);
    try {
      onCreate({
        temperature: temp,
        measured_at: new Date(measuredAt).toISOString(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetWrapper title="体温を追加" onClose={onClose}>
      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">体温 (℃)</span>
          <input
            type="number"
            step="0.1"
            min="34"
            max="42"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">計測日時</span>
          <input
            type="datetime-local"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
      </div>
      <SheetFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} />
    </SheetWrapper>
  );
}

// ===== 睡眠 新規追加 =====


type SleepAddProps = {
  dateStr: string;
  category: SleepCategory;
  onCreate: (data: { sleep_date: string; started_at: string; ended_at: string; sleep_category: SleepCategory }) => void;
  onClose: () => void;
};

export function SleepAddSheet({ dateStr, category, onCreate, onClose }: SleepAddProps) {
  const defaults = SLEEP_DEFAULT_TIMES[category];
  const [startTime, setStartTime] = useState(defaults.start);
  const [endTime, setEndTime] = useState(defaults.end);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const startISO = new Date(`${dateStr}T${startTime}:00`).toISOString();
      let endISO = new Date(`${dateStr}T${endTime}:00`).toISOString();
      if (endTime <= startTime) {
        const nextDay = new Date(`${dateStr}T${endTime}:00`);
        nextDay.setDate(nextDay.getDate() + 1);
        endISO = nextDay.toISOString();
      }
      onCreate({
        sleep_date: dateStr,
        started_at: startISO,
        ended_at: endISO,
        sleep_category: category,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetWrapper title={`${category === "night" ? "夜間" : "日中"}睡眠を追加`} onClose={onClose}>
      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">開始時刻</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">終了時刻</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
      </div>
      <SheetFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} />
    </SheetWrapper>
  );
}

// ===== 食事 新規追加 =====

type MealAddProps = {
  dateStr: string;
  mealType: MealType;
  onCreate: (data: { meal_date: string; meal_type: MealType; amount: string }) => void;
  onClose: () => void;
};

export function MealAddSheet({ dateStr, mealType, onCreate, onClose }: MealAddProps) {
  const [amount, setAmount] = useState<string>("normal");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      onCreate({ meal_date: dateStr, meal_type: mealType, amount });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetWrapper title={`${MEAL_TYPE_OPTIONS.find((o) => o.value === mealType)?.label}を追加`} onClose={onClose}>
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">食事量</span>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_AMOUNT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAmount(opt.value)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                amount === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <SheetFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} />
    </SheetWrapper>
  );
}

// ===== 共通パーツ =====

function SheetWrapper({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/40" />
      {/* シート本体 */}
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-card px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function SheetFooter({
  onClose,
  onSubmit,
  saving,
}: {
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-5 flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
      >
        キャンセル
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {saving ? "保存中..." : "保存"}
      </button>
    </div>
  );
}
