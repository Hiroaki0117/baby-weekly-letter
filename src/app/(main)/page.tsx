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
      const { data, error } = await client
        .from("daily_logs")
        .select("*")
        .eq("log_date", todayStr)
        .order("created_at", { ascending: false });

      if (!error) {
        setLogs((data as DailyLog[]) ?? []);
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

    // 写真も削除
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

  return (
    <div className="space-y-6">
      {/* 日付バナー */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-orange-50 to-yellow-50 border border-primary/20 p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌤️</span>
          <div>
            <p className="text-xs text-muted-foreground font-medium">TODAY</p>
            <h1 className="text-xl font-bold text-foreground">
              {formatDateJa(new Date())}
            </h1>
          </div>
        </div>
      </div>

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

      {logs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              今日のきろく
            </h2>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {logs.length}件
            </span>
          </div>
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
