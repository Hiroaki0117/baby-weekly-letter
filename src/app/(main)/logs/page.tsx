"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogCard } from "@/components/log/log-card";
import { LogForm } from "@/components/log/log-form";
import { toast } from "sonner";
import type { DailyLog } from "@/types";

export default function LogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();

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
      const { data, error } = await client
        .from("daily_logs")
        .select("*")
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error) {
        setLogs((data as DailyLog[]) ?? []);
      }
      setLoading(false);
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
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ログ一覧</h1>

      {editingLog && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">ログを編集</h2>
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
        </div>
      )}

      {logs.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          まだログがありません
        </p>
      ) : (
        <div className="space-y-3">
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
