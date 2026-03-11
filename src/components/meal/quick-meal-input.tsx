"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { addMealRecord } from "@/lib/meal";
import { toast } from "sonner";
import { ChildSelector } from "@/components/child/child-selector";
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
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id ?? "");
  const [mealType, setMealType] = useState<MealType | "">("");
  const [mealAmount, setMealAmount] = useState<MealAmount | "">("");
  const [saving, setSaving] = useState(false);
  const supabaseRef = useRef(createClient());

  // childrenList が後から渡された場合に同期
  useEffect(() => {
    if (!selectedChildId && childrenList.length > 0) {
      setSelectedChildId(childrenList[0].id);
    }
  }, [childrenList, selectedChildId]);

  if (childrenList.length === 0) return null;

  const showSelector = childrenList.length >= 2;
  const today = format(new Date(), "yyyy-MM-dd");

  async function handleRecord() {
    if (!mealType || !mealAmount) {
      toast.error("食事種別と量を選択してください");
      return;
    }

    setSaving(true);
    try {
      await addMealRecord(supabaseRef.current, {
        child_id: selectedChildId,
        meal_date: today,
        meal_type: mealType,
        amount: mealAmount,
      });
      const child = childrenList.find((c) => c.id === selectedChildId);
      const typeLabel = MEAL_TYPE_OPTIONS.find((o) => o.value === mealType)?.label ?? "";
      toast.success(`${child?.name ?? ""}の${typeLabel}を記録しました`);
      setMealType("");
      setMealAmount("");
    } catch {
      toast.error("記録に失敗しました");
    } finally {
      setSaving(false);
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
        <div className="space-y-3 border-t border-border/40 px-4 py-3">
          {/* 子供セレクタ（2人以上の場合） */}
          {showSelector && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium tracking-wider text-muted-foreground">
                だれの記録？
              </p>
              <ChildSelector
                childrenList={childrenList}
                selectedId={selectedChildId}
                onChange={setSelectedChildId}
              />
            </div>
          )}

          <p className="mt-1 text-xs font-medium tracking-wider text-muted-foreground">
            食事の種類
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMealType(opt.value)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                  mealType === opt.value
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
                onClick={() => setMealAmount(opt.value)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                  mealAmount === opt.value
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
              onClick={handleRecord}
              disabled={saving || !mealType || !mealAmount}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "..." : "記録"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
