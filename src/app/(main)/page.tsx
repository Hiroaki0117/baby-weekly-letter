"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toDateString, formatDateJa, calcAge } from "@/lib/date";
import { getMyFamilyId } from "@/lib/supabase/family";
import { getStreak } from "@/lib/streak";
import { deleteLog } from "@/lib/log-actions";
import { buildReactionMap, toggleReaction, type ReactionSummary } from "@/lib/reactions";
import { LogForm } from "@/components/log/log-form";
import { LogCard } from "@/components/log/log-card";
import { MemoriesSection } from "@/components/memory/memories-section";
import { ReactionNotice } from "@/components/home/reaction-notice";
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
  const [reactionMap, setReactionMap] = useState<Record<string, ReactionSummary[]>>({});
  const [newReactionCount, setNewReactionCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
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

    const fetchedLogs = (logsRes.data as DailyLog[]) ?? [];
    setLogs(fetchedLogs);
    setStreak(streakCount);

    // リアクション取得
    if (fetchedLogs.length > 0 && currentUserId) {
      const logIds = fetchedLogs.map((l) => l.id);
      const { data: reactionsData } = await supabase
        .from("log_reactions")
        .select("log_id, user_id, emoji")
        .in("log_id", logIds);
      if (reactionsData) {
        setReactionMap(buildReactionMap(reactionsData, currentUserId));
      }
    }
  }

  useEffect(() => {
    const client = supabaseRef.current;
    const todayStr = toDateString(new Date());
    async function load() {
      const [logsRes, membersRes, streakCount, userRes] = await Promise.all([
        client
          .from("daily_logs")
          .select("*")
          .eq("log_date", todayStr)
          .order("created_at", { ascending: false }),
        client
          .from("family_members")
          .select("user_id, display_name"),
        getStreak(client),
        client.auth.getUser(),
      ]);

      const userId = userRes.data.user?.id ?? "";
      setCurrentUserId(userId);

      const fetchedLogs: DailyLog[] = [];
      if (!logsRes.error) {
        const data = (logsRes.data as DailyLog[]) ?? [];
        fetchedLogs.push(...data);
        setLogs(data);
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

      // リアクション取得
      if (fetchedLogs.length > 0 && userId) {
        const logIds = fetchedLogs.map((l) => l.id);
        const { data: reactionsData } = await client
          .from("log_reactions")
          .select("log_id, user_id, emoji")
          .in("log_id", logIds);
        if (reactionsData) {
          setReactionMap(buildReactionMap(reactionsData, userId));
        }
      }

      // 新着リアクション件数（自分が書いたログへの他人のリアクション）
      if (userId) {
        const lastChecked = localStorage.getItem("lastReactionCheckedAt") ?? "1970-01-01T00:00:00Z";
        const { count } = await client
          .from("log_reactions")
          .select("id, daily_logs!inner(author_id)", { count: "exact", head: true })
          .eq("daily_logs.author_id", userId)
          .neq("user_id", userId)
          .gt("created_at", lastChecked);
        setNewReactionCount(count ?? 0);
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

  const handleToggleReaction = useCallback(
    async (logId: string, emoji: string) => {
      if (!currentUserId) return;
      const current = reactionMap[logId] ?? [];
      const summary = current.find((r) => r.emoji === emoji);
      const wasReacted = summary?.reacted ?? false;

      // 楽観的更新
      setReactionMap((prev) => {
        const updated = { ...prev };
        const entries = (updated[logId] ?? []).map((r) =>
          r.emoji === emoji
            ? {
                ...r,
                count: r.count + (wasReacted ? -1 : 1),
                reacted: !wasReacted,
                userIds: wasReacted
                  ? r.userIds.filter((id) => id !== currentUserId)
                  : [...r.userIds, currentUserId],
              }
            : r
        );
        updated[logId] = entries;
        return updated;
      });

      await toggleReaction(supabase, logId, currentUserId, emoji, wasReacted);
    },
    [currentUserId, reactionMap, supabase]
  );

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

      {/* 新着リアクション通知 */}
      <ReactionNotice count={newReactionCount} />

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
              reactions={reactionMap[log.id]}
              nameMap={authorNames}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleReaction={handleToggleReaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
