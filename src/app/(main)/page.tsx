"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toDateString, formatDateJa } from "@/lib/date";
import { LogForm } from "@/components/log/log-form";
import { LogCard } from "@/components/log/log-card";
import { toast } from "sonner";
import type { DailyLog } from "@/types";

export default function HomePage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const today = toDateString(new Date());

  async function fetchTodayLogs() {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("log_date", today)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("ログの取得に失敗しました");
      return;
    }

    setLogs((data as DailyLog[]) ?? []);
  }

  useEffect(() => {
    const client = supabaseRef.current;
    const todayStr = toDateString(new Date());
    async function load() {
      const [logsRes, membersRes] = await Promise.all([
        client
          .from("daily_logs")
          .select("*")
          .eq("log_date", todayStr)
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
    }
    load();
  }, []);

  async function handleEdit(log: DailyLog) {
    let photoUrl: string | null = null;
    if (log.photo_storage_path) {
      const { data } = supabase.storage
        .from("log-photos")
        .getPublicUrl(log.photo_storage_path);
      photoUrl = data.publicUrl;
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
    fetchTodayLogs();
  }

  function handleSaved() {
    setEditingLog(null);
    setEditingPhotoUrl(null);
    fetchTodayLogs();
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* 日付ヘッダー（手帳ページ風） */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card px-6 py-5 shadow-sm">
        {/* 右上の小さなドット飾り */}
        <div className="absolute right-4 top-4 flex gap-1 opacity-30">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-primary" />
          ))}
        </div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Today
        </p>
        <h1 className="font-mincho mt-1 text-2xl font-semibold tracking-wide text-foreground">
          {formatDateJa(now)}
        </h1>
        {/* 罫線装飾 */}
        <div className="mt-3 space-y-1.5">
          <div className="h-px bg-border/60" />
          <div className="h-px bg-border/30" />
        </div>
      </div>

      {/* ログフォーム */}
      <LogForm
        key={editingLog?.id ?? "new"}
        editingLog={editingLog}
        existingPhotoUrl={editingPhotoUrl}
        onSaved={handleSaved}
        onCancel={
          editingLog
            ? () => {
                setEditingLog(null);
                setEditingPhotoUrl(null);
              }
            : undefined
        }
      />

      {/* 今日のログ */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {logs.length}件のきろく
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          {logs.map((log) => (
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
