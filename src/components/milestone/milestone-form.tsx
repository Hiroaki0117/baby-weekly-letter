"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { milestoneSchema, type MilestoneFormValues } from "@/schemas/milestone";
import { createClient } from "@/lib/supabase/client";
import { createMilestone, updateMilestone } from "@/lib/milestones";
import { MILESTONE_CATEGORY_OPTIONS } from "@/types";
import { toast } from "sonner";
import type { Milestone } from "@/types";

type MilestoneFormProps = {
  childId: string;
  milestone: Milestone | null;
  onClose: () => void;
  onSaved: () => void;
};

export function MilestoneForm({
  childId,
  milestone,
  onClose,
  onSaved,
}: MilestoneFormProps) {
  const isEdit = milestone !== null;
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: milestone?.title ?? "",
      milestone_date: milestone?.milestone_date ?? new Date().toISOString().slice(0, 10),
      category: (milestone?.category as MilestoneFormValues["category"]) ?? "other",
      memo: milestone?.memo ?? "",
    },
  });

  async function onSubmit(values: MilestoneFormValues) {
    try {
      if (isEdit) {
        await updateMilestone(supabase, milestone.id, {
          title: values.title,
          milestone_date: values.milestone_date,
          category: values.category,
          memo: values.memo || null,
        });
        toast.success("マイルストーンを更新しました");
      } else {
        await createMilestone(supabase, {
          child_id: childId,
          title: values.title,
          milestone_date: values.milestone_date,
          category: values.category,
          memo: values.memo || undefined,
          source: "manual",
        });
        toast.success("マイルストーンを追加しました");
      }
      onSaved();
    } catch {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました");
    }
  }

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* ダイアログ */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-xl border border-border/60 bg-card p-5 shadow-xl">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          {isEdit ? "マイルストーンを編集" : "マイルストーンを追加"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* タイトル */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              タイトル
            </label>
            <input
              {...register("title")}
              placeholder="初めて寝返りした"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* 日付 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              日付
            </label>
            <input
              type="date"
              {...register("milestone_date")}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            {errors.milestone_date && (
              <p className="mt-1 text-xs text-destructive">
                {errors.milestone_date.message}
              </p>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              カテゴリ
            </label>
            <select
              {...register("category")}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            >
              {MILESTONE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* メモ */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              メモ（任意）
            </label>
            <textarea
              {...register("memo")}
              rows={2}
              placeholder="補足情報があれば..."
              className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            {errors.memo && (
              <p className="mt-1 text-xs text-destructive">{errors.memo.message}</p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border/60 bg-background py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "保存中..." : isEdit ? "更新" : "追加"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
