"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toDateString, formatDateJa, calcAge } from "@/lib/date";
import { getMyFamilyId } from "@/lib/supabase/family";
import { getStreak } from "@/lib/streak";
import { deleteLog } from "@/lib/log-actions";
import { LogForm } from "@/components/log/log-form";
import { LogCard } from "@/components/log/log-card";
import { MemoriesSection } from "@/components/memory/memories-section";
import { toast } from "sonner";
import type { Child, DailyLog } from "@/types";

export default function HomePage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [streak, setStreak] = useState(0);
  const [cardLoaded, setCardLoaded] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const today = toDateString(new Date());

  async function fetchTodayLogs() {
    const [logsRes, streakCount] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("*")
        .eq("log_date", today)
        .order("created_at", { ascending: false }),
      getStreak(supabase),
    ]);

    if (logsRes.error) {
      toast.error("ログの取得に失敗しました");
      return;
    }

    setLogs((logsRes.data as DailyLog[]) ?? []);
    setStreak(streakCount);
  }

  useEffect(() => {
    const client = supabaseRef.current;
    const todayStr = toDateString(new Date());
    async function load() {
      const [logsRes, membersRes, streakCount] = await Promise.all([
        client
          .from("daily_logs")
          .select("*")
          .eq("log_date", todayStr)
          .order("created_at", { ascending: false }),
        client
          .from("family_members")
          .select("user_id, display_name"),
        getStreak(client),
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
      setStreak(streakCount);

      // 子ども情報を取得（複数対応）
      const familyId = await getMyFamilyId(client);
      if (familyId) {
        const { data: childrenData } = await client
          .from("children")
          .select("*")
          .eq("family_id", familyId)
          .order("created_at", { ascending: true });
        if (childrenData) {
          setChildrenList(childrenData as Child[]);
        }
      }
      setCardLoaded(true);
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
    const errorMsg = await deleteLog(supabase, id, log?.photo_storage_path ?? null);
    if (errorMsg) {
      toast.error(errorMsg);
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
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-card to-primary/5 px-6 py-5 shadow-sm shadow-primary/8">
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

        {/* 情報エリア */}
        <div className="mt-3 space-y-1">
          {!cardLoaded ? (
            <>
              <div className="h-4 w-40 animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-52 animate-pulse rounded bg-muted/40" />
            </>
          ) : (
            <>
              {childrenList.map(
                (child) =>
                  child.birth_date && (
                    <p
                      key={child.id}
                      className="text-xs text-muted-foreground"
                    >
                      <span className="mr-1.5">🍼</span>
                      {child.name ? `${child.name}・` : ""}
                      {calcAge(child.birth_date)}
                    </p>
                  )
              )}
              <p className="text-xs text-muted-foreground">
                <span className="mr-1.5">📝</span>
                {logs.length === 0
                  ? "今日はまだ記録がありません"
                  : `今日は${logs.length}件の記録があります`}
              </p>
              {streak > 0 && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                  <span className="text-base leading-none">🔥</span>
                  <span className="text-sm font-bold text-primary">
                    {streak}日連続記録中！
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ○年前の今日 */}
      <MemoriesSection childrenList={childrenList} />

      {/* ログフォーム */}
      <LogForm
        key={editingLog?.id ?? "new"}
        childrenList={childrenList}
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
            <span className="text-[10px] font-medium uppercase tracking-widest text-primary/70">
              {logs.length}件の記録
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              childName={childrenList.length >= 2 ? childrenList.find((c) => c.id === log.child_id)?.name : undefined}
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
