"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogCard } from "@/components/log/log-card";
import { LogForm } from "@/components/log/log-form";
import { LogFilter } from "@/components/log/log-filter";
import { toast } from "sonner";
import type { DailyLog, Mood } from "@/types";

export default function LogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();

  // フィルター状態
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (
        selectedMoods.length > 0 &&
        !selectedMoods.includes(log.mood as Mood)
      )
        return false;
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.some((c) => log.categories.includes(c))
      )
        return false;
      if (searchText.trim()) {
        const needle = searchText.trim().toLowerCase();
        if (!log.text.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [logs, selectedMoods, selectedCategories, searchText]);

  function clearFilters() {
    setSelectedMoods([]);
    setSelectedCategories([]);
    setSearchText("");
  }

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("ログの取得に失敗しました");
      return;
    }

    setLogs((data as DailyLog[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const [logsRes, membersRes] = await Promise.all([
        client
          .from("daily_logs")
          .select("*")
          .order("log_date", { ascending: false })
          .order("created_at", { ascending: false }),
        client
          .from("family_members")
          .select("user_id, display_name"),
      ]);

      if (!logsRes.error) {
        setLogs((logsRes.data as DailyLog[]) ?? []);
      }
      if (!membersRes.error && membersRes.data) {
        const names: Record<string, string> = {};
        for (const m of membersRes.data as { user_id: string; display_name: string | null }[]) {
          if (m.display_name) names[m.user_id] = m.display_name;
        }
        setAuthorNames(names);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleEdit(log: DailyLog) {
    let photoUrl: string | null = null;
    if (log.photo_storage_path) {
      const { data } = await supabase.storage
        .from("log-photos")
        .createSignedUrl(log.photo_storage_path, 3600);
      photoUrl = data?.signedUrl ?? null;
    }
    setEditingPhotoUrl(photoUrl);
    setEditingLog(log);
  }

  async function handleDelete(id: string) {
    const log = logs.find((l) => l.id === id);

    if (log?.photo_storage_path) {
      await supabase.storage
        .from("log-photos")
        .remove([log.photo_storage_path]);
    }

    const { error } = await supabase.from("daily_logs").delete().eq("id", id);

    if (error) {
      toast.error("削除に失敗しました");
      return;
    }

    toast.success("ログを削除しました");
    fetchLogs();
  }

  function handleSaved() {
    setEditingLog(null);
    setEditingPhotoUrl(null);
    fetchLogs();
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ページヘッダー */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            All Records
          </p>
          <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
            記録一覧
          </h1>
        </div>
        {logs.length > 0 && (
          <span className="font-mono text-2xl font-light leading-none text-muted-foreground/50">
            {String(logs.length).padStart(3, "0")}
          </span>
        )}
      </div>

      <div className="h-px bg-border/60" />

      {/* フィルター */}
      {logs.length > 0 && (
        <LogFilter
          selectedMoods={selectedMoods}
          onMoodsChange={setSelectedMoods}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          totalCount={logs.length}
          filteredCount={filteredLogs.length}
          onClear={clearFilters}
        />
      )}

      {/* 編集フォーム */}
      {editingLog && (
        <LogForm
          key={editingLog.id}
          editingLog={editingLog}
          existingPhotoUrl={editingPhotoUrl}
          onSaved={handleSaved}
          onCancel={() => {
            setEditingLog(null);
            setEditingPhotoUrl(null);
          }}
        />
      )}

      {/* ログ一覧 */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-2xl">
            📝
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">まだログがありません</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              ホームから最初の記録を残してみましょう
            </p>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-2xl">
            🔍
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              条件に合うログがありません
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-xs text-primary transition-colors hover:text-primary/80"
            >
              フィルターをクリア
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              authorDisplayName={authorNames[log.author_id]}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
