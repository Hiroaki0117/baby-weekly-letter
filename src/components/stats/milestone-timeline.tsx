"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchMilestones,
  updateMilestone,
  deleteMilestone,
} from "@/lib/milestones";
import { formatDateJa } from "@/lib/date";
import {
  MILESTONE_CATEGORY_OPTIONS,
  type Milestone,
  type MilestoneCategory,
} from "@/types";
import { FilterShell } from "@/components/ui/filter-shell";
import { toast } from "sonner";

type MilestoneTimelineProps = {
  childId: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  motor: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800",
  language: "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/50 dark:border-purple-800",
  eating: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-800",
  lifestyle: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-800",
  other: "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/50 dark:border-gray-800",
};

const DOT_COLORS: Record<string, string> = {
  motor: "bg-blue-500",
  language: "bg-purple-500",
  eating: "bg-orange-500",
  lifestyle: "bg-green-500",
  other: "bg-gray-400",
};

export function MilestoneTimeline({ childId }: MilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<MilestoneCategory | null>(null);
  const [searchText, setSearchText] = useState("");
  const [editTarget, setEditTarget] = useState<Milestone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Milestone | null>(null);
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
  }, [childId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const filtered = milestones.filter((m) => {
    if (filterCategory && m.category !== filterCategory) return false;
    if (searchText.trim()) {
      const needle = searchText.trim().toLowerCase();
      if (!m.title.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMilestone(supabase, deleteTarget.id);
      toast.success("マイルストーンを削除しました");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeFilterCount = filterCategory ? 1 : 0;

  function handleClear() {
    setFilterCategory(null);
    setSearchText("");
  }

  return (
    <div className="space-y-4">
      <FilterShell
        searchText={searchText}
        onSearchTextChange={setSearchText}
        searchPlaceholder="マイルストーンを検索..."
        activeFilterCount={activeFilterCount}
        totalCount={milestones.length}
        filteredCount={filtered.length}
        onClear={handleClear}
      >
        {/* カテゴリフィルタ */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            カテゴリ
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MILESTONE_CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setFilterCategory(
                    filterCategory === opt.value ? null : (opt.value as MilestoneCategory)
                  )
                }
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                  filterCategory === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </FilterShell>

      {/* タイムライン */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {milestones.length === 0
              ? "まだマイルストーンがありません"
              : "該当するマイルストーンがありません"}
          </p>
          {milestones.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground/70">
              ログ入力時に「はじめてできたこと」を記録すると表示されます
            </p>
          )}
        </div>
      ) : (
        <div className="relative ml-3">
          {/* タイムラインの縦線 */}
          <div className="absolute left-0 top-2 bottom-2 w-px bg-border/60" />

          <div className="space-y-4">
            {filtered.map((m) => {
              const catOpt = MILESTONE_CATEGORY_OPTIONS.find(
                (o) => o.value === m.category
              );
              return (
                <div key={m.id} className="group relative pl-6">
                  {/* ドット */}
                  <div
                    className={`absolute left-0 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-card ${
                      DOT_COLORS[m.category] ?? DOT_COLORS.other
                    }`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {m.title}
                      </p>
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setEditTarget(m)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateJa(m.milestone_date)}
                      </span>
                      {catOpt && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            CATEGORY_COLORS[m.category] ?? CATEGORY_COLORS.other
                          }`}
                        >
                          {catOpt.emoji} {catOpt.label}
                        </span>
                      )}
                      {m.source === "ai" && (
                        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                          AI検出
                        </span>
                      )}
                    </div>
                    {m.memo && (
                      <p className="text-xs text-muted-foreground/80">
                        {m.memo}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 編集ダイアログ */}
      {editTarget && (
        <EditDialog
          milestone={editTarget}
          supabase={supabase}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}

      {/* 削除確認ダイアログ */}
      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-xs -translate-y-1/2 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
            <div className="px-6 pt-6 pb-4 text-center">
              <p className="text-sm font-medium text-foreground">
                「{deleteTarget.title}」を削除しますか？
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                この操作は取り消せません
              </p>
            </div>
            <div className="flex border-t border-border/40">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                キャンセル
              </button>
              <div className="w-px bg-border/40" />
              <button
                onClick={handleDelete}
                className="flex-1 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
              >
                削除する
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- 編集ダイアログ ---

function EditDialog({
  milestone,
  supabase,
  onClose,
  onSaved,
}: {
  milestone: Milestone;
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(milestone.title);
  const [date, setDate] = useState(milestone.milestone_date);
  const [category, setCategory] = useState(milestone.category);
  const [memo, setMemo] = useState(milestone.memo ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateMilestone(supabase, milestone.id, {
        title: title.trim(),
        milestone_date: date,
        category,
        memo: memo.trim() || null,
      });
      toast.success("マイルストーンを更新しました");
      onSaved();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-xl border border-border/60 bg-card p-5 shadow-xl">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          マイルストーンを編集
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              タイトル
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              日付
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            >
              {MILESTONE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
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
              disabled={saving || !title.trim()}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "保存中..." : "更新"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
