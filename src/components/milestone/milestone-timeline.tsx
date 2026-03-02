"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMilestones, deleteMilestone } from "@/lib/milestones";
import { MilestoneCard } from "./milestone-card";
import { MilestoneCategoryFilter } from "./milestone-category-filter";
import { MilestoneForm } from "./milestone-form";
import { toast } from "sonner";
import type { Milestone, MilestoneCategory } from "@/types";

type MilestoneTimelineProps = {
  childId: string;
};

export function MilestoneTimeline({ childId }: MilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<MilestoneCategory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Milestone | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    try {
      const data = await fetchMilestones(supabase, childId);
      setMilestones(data);
    } catch {
      toast.error("マイルストーンの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [supabase, childId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filterCategory
    ? milestones.filter((m) => m.category === filterCategory)
    : milestones;

  function handleEdit(milestone: Milestone) {
    setEditTarget(milestone);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteMilestone(supabase, id);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      toast.success("マイルストーンを削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(null);
  }

  function handleFormSaved() {
    handleFormClose();
    load();
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          成長マイルストーン
        </h3>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
        >
          + 追加
        </button>
      </div>

      {/* カテゴリフィルタ */}
      <MilestoneCategoryFilter
        selected={filterCategory}
        onChange={setFilterCategory}
      />

      {/* タイムライン */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          {milestones.length === 0
            ? "まだマイルストーンがありません"
            : "該当するマイルストーンがありません"}
        </p>
      ) : (
        <div>
          {filtered.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 追加・編集フォーム */}
      {formOpen && (
        <MilestoneForm
          childId={childId}
          milestone={editTarget}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
