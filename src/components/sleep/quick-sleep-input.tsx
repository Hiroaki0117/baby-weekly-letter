"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { addSleepRecord, buildTimestamps, calcDurationMinutes } from "@/lib/sleep";
import { toast } from "sonner";
import type { Child } from "@/types";

type Props = {
  childrenList: Child[];
};

function calcPreview(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function QuickSleepInput({ childrenList }: Props) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<Record<string, { start: string; end: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const supabaseRef = useRef(createClient());

  if (childrenList.length === 0) return null;

  const today = format(new Date(), "yyyy-MM-dd");

  async function handleRecord(childId: string) {
    const input = inputs[childId];
    if (!input?.start || !input?.end) {
      toast.error("就寝・起床時刻を入力してください");
      return;
    }

    setSaving((prev) => ({ ...prev, [childId]: true }));
    try {
      const { startedAt, endedAt } = buildTimestamps(today, input.start, input.end);
      const duration = calcDurationMinutes(startedAt, endedAt);
      await addSleepRecord(supabaseRef.current, {
        child_id: childId,
        sleep_date: today,
        started_at: startedAt,
        ended_at: endedAt,
        duration_minutes: duration,
      });
      setInputs((prev) => ({ ...prev, [childId]: { start: "", end: "" } }));
      const child = childrenList.find((c) => c.id === childId);
      toast.success(`${child?.name ?? ""}の睡眠を記録しました`);
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
        <span>😴 睡眠を記録</span>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/40 px-4 py-3">
          {childrenList.map((child) => {
            const input = inputs[child.id] ?? { start: "", end: "" };
            const preview = calcPreview(input.start, input.end);
            return (
              <div key={child.id} className="space-y-1.5">
                <span className="text-sm text-foreground">{child.name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={input.start}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [child.id]: { ...input, start: e.target.value },
                      }))
                    }
                    className="w-24 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <input
                    type="time"
                    value={input.end}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [child.id]: { ...input, end: e.target.value },
                      }))
                    }
                    className="w-24 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {preview && (
                    <span className="text-xs font-medium text-foreground">{preview}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRecord(child.id)}
                    disabled={saving[child.id] || !input.start || !input.end}
                    className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving[child.id] ? "..." : "記録"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
