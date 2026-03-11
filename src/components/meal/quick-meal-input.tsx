"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { addMealRecord } from "@/lib/meal";
import { toast } from "sonner";
import {
  MEAL_TYPE_OPTIONS,
  MEAL_AMOUNT_OPTIONS,
  type Child,
  type MealType,
  type MealAmount,
} from "@/types";

type Props = {
  childrenList: Child[];
};

export function QuickMealInput({ childrenList }: Props) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<Record<string, { type: MealType | ""; amount: MealAmount | "" }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const supabaseRef = useRef(createClient());

  if (childrenList.length === 0) return null;

  const today = format(new Date(), "yyyy-MM-dd");

  async function handleRecord(childId: string) {
    const input = inputs[childId];
    if (!input?.type || !input?.amount) {
      toast.error("食事種別と量を選択してください");
      return;
    }

    setSaving((prev) => ({ ...prev, [childId]: true }));
    try {
      await addMealRecord(supabaseRef.current, {
        child_id: childId,
        meal_date: today,
        meal_type: input.type,
        amount: input.amount,
      });
      setInputs((prev) => ({ ...prev, [childId]: { type: "", amount: "" } }));
      const child = childrenList.find((c) => c.id === childId);
      const typeLabel = MEAL_TYPE_OPTIONS.find((o) => o.value === input.type)?.label ?? "";
      toast.success(`${child?.name ?? ""}の${typeLabel}を記録しました`);
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
        <span>🍽 食事を記録</span>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/40 px-4 py-3">
          {childrenList.map((child) => {
            const input = inputs[child.id] ?? { type: "", amount: "" };
            return (
              <div key={child.id} className="space-y-2">
                <span className="text-sm text-foreground">{child.name}</span>
                <p className="mt-1 text-xs font-medium tracking-wider text-muted-foreground">
                  食事の種類
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MEAL_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setInputs((prev) => ({
                          ...prev,
                          [child.id]: { ...input, type: opt.value },
                        }))
                      }
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                        input.type === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground">
                  量
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MEAL_AMOUNT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setInputs((prev) => ({
                          ...prev,
                          [child.id]: { ...input, amount: opt.value },
                        }))
                      }
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                        input.amount === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRecord(child.id)}
                    disabled={saving[child.id] || !input.type || !input.amount}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
