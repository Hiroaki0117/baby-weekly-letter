"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { addTemperatureRecord, classifyTempPeriod } from "@/lib/temperature";
import { toast } from "sonner";
import type { Child } from "@/types";

/** ローカル日時を datetime-local 用フォーマット (YYYY-MM-DDTHH:mm) に変換 */
function toLocalDatetimeString(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

type Props = {
  childrenList: Child[];
};

export function QuickTemperatureInput({ childrenList }: Props) {
  const [open, setOpen] = useState(false);
  const [temperatures, setTemperatures] = useState<Record<string, string>>({});
  const [measuredAts, setMeasuredAts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const supabaseRef = useRef(createClient());

  if (childrenList.length === 0) return null;

  async function handleRecord(childId: string) {
    const value = temperatures[childId];
    if (!value) return;

    const temp = parseFloat(value);
    if (isNaN(temp) || temp < 34.0 || temp > 42.0) {
      toast.error("34.0〜42.0℃の範囲で入力してください");
      return;
    }

    setSaving((prev) => ({ ...prev, [childId]: true }));
    try {
      const dtValue = measuredAts[childId];
      const measuredAt = dtValue ? new Date(dtValue).toISOString() : new Date().toISOString();
      await addTemperatureRecord(supabaseRef.current, {
        child_id: childId,
        measured_at: measuredAt,
        temperature: temp,
        temp_period: classifyTempPeriod(measuredAt),
      });
      setTemperatures((prev) => ({ ...prev, [childId]: "" }));
      setMeasuredAts((prev) => ({ ...prev, [childId]: "" }));
      const child = childrenList.find((c) => c.id === childId);
      toast.success(`${child?.name ?? ""}の体温を記録しました`);
    } catch {
      toast.error("記録に失敗しました");
    } finally {
      setSaving((prev) => ({ ...prev, [childId]: false }));
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
      >
        <span>🌡 体温を記録</span>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border/40 px-4 py-3">
          {childrenList.map((child) => (
            <div key={child.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="min-w-[4rem] text-sm text-foreground">
                  {child.name}
                </span>
                <div className="flex flex-1 items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="34.0"
                    max="42.0"
                    placeholder="36.5"
                    value={temperatures[child.id] ?? ""}
                    onChange={(e) =>
                      setTemperatures((prev) => ({
                        ...prev,
                        [child.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRecord(child.id);
                    }}
                    className="w-20 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">℃</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRecord(child.id)}
                  disabled={saving[child.id] || !temperatures[child.id]}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving[child.id] ? "..." : "記録"}
                </button>
              </div>
              <div className="flex items-center gap-1.5 pl-[4.5rem]">
                <span className="text-[11px] text-muted-foreground">🕐</span>
                <input
                  type="datetime-local"
                  value={measuredAts[child.id] ?? toLocalDatetimeString(new Date())}
                  onChange={(e) =>
                    setMeasuredAts((prev) => ({
                      ...prev,
                      [child.id]: e.target.value,
                    }))
                  }
                  className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
