"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { addTemperatureRecord } from "@/lib/temperature";
import { toast } from "sonner";
import type { Child } from "@/types";

type Props = {
  childrenList: Child[];
};

export function QuickTemperatureInput({ childrenList }: Props) {
  const [open, setOpen] = useState(false);
  const [temperatures, setTemperatures] = useState<Record<string, string>>({});
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
      await addTemperatureRecord(supabaseRef.current, {
        child_id: childId,
        measured_at: new Date().toISOString(),
        temperature: temp,
      });
      setTemperatures((prev) => ({ ...prev, [childId]: "" }));
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
            <div key={child.id} className="flex items-center gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}
