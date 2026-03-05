"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toDateString, formatDateJa, calcAge } from "@/lib/date";
import { getMyFamilyId } from "@/lib/supabase/family";
import { getStreak } from "@/lib/streak";
import { deleteLog } from "@/lib/log-actions";
import { buildReactionMap, toggleReaction, emptyReactionSummaries, type ReactionSummary } from "@/lib/reactions";
import { buildCommentMap, addComment, updateComment, deleteComment, type CommentEntry } from "@/lib/comments";
import { fetchMilestonesByLogIds } from "@/lib/milestones";
import { LogForm } from "@/components/log/log-form";
import { LogCard } from "@/components/log/log-card";
import { MemoriesSection } from "@/components/memory/memories-section";
import { ReactionNotice } from "@/components/home/reaction-notice";
import { toast } from "sonner";
import type { Child, DailyLog, Milestone } from "@/types";

export default function HomePage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [streak, setStreak] = useState(0);
  const [cardLoaded, setCardLoaded] = useState(false);
  const [reactionMap, setReactionMap] = useState<Record<string, ReactionSummary[]>>({});
  const [commentMap, setCommentMap] = useState<Record<string, CommentEntry[]>>({});
  const [milestoneMap, setMilestoneMap] = useState<Record<string, Milestone>>({});
  const [newReactionCount, setNewReactionCount] = useState(0);
  const [newCommentCount, setNewCommentCount] = useState(0);
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

    if (fetchedLogs.length > 0) {
      const logIds = fetchedLogs.map((l) => l.id);

      // リアクション取得
      if (currentUserId) {
        const { data: reactionsData } = await supabase
          .from("log_reactions")
          .select("log_id, user_id, emoji")
          .in("log_id", logIds);
        if (reactionsData) {
          setReactionMap(buildReactionMap(reactionsData, currentUserId));
        }
      }

      // コメント取得
      const { data: commentsData } = await supabase
        .from("log_comments")
        .select("id, log_id, user_id, text, created_at, updated_at")
        .in("log_id", logIds)
        .order("created_at", { ascending: true });
      if (commentsData) {
        setCommentMap(buildCommentMap(commentsData));
      }

      // マイルストーン取得
      const msMap = await fetchMilestonesByLogIds(supabase, logIds);
      setMilestoneMap(msMap);
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

      // リアクション・マイルストーン取得
      if (fetchedLogs.length > 0) {
        const logIds = fetchedLogs.map((l) => l.id);

        if (userId) {
          const { data: reactionsData } = await client
            .from("log_reactions")
            .select("log_id, user_id, emoji")
            .in("log_id", logIds);
          if (reactionsData) {
            setReactionMap(buildReactionMap(reactionsData, userId));
          }
        }

        // コメント取得
        const { data: commentsData } = await client
          .from("log_comments")
          .select("id, log_id, user_id, text, created_at, updated_at")
          .in("log_id", logIds)
          .order("created_at", { ascending: true });
        if (commentsData) {
          setCommentMap(buildCommentMap(commentsData));
        }

        const msMap = await fetchMilestonesByLogIds(client, logIds);
        setMilestoneMap(msMap);
      }

      // 新着リアクション・コメント件数（自分が書いたログへの他人の反応）
      if (userId) {
        const lastReactionChecked = localStorage.getItem("lastReactionCheckedAt") ?? "1970-01-01T00:00:00Z";
        const { count: reactionCount } = await client
          .from("log_reactions")
          .select("id, daily_logs!inner(author_id)", { count: "exact", head: true })
          .eq("daily_logs.author_id", userId)
          .neq("user_id", userId)
          .gt("created_at", lastReactionChecked);
        setNewReactionCount(reactionCount ?? 0);

        const lastCommentChecked = localStorage.getItem("lastCommentCheckedAt") ?? "1970-01-01T00:00:00Z";
        const { count: commentCount } = await client
          .from("log_comments")
          .select("id, daily_logs!inner(author_id)", { count: "exact", head: true })
          .eq("daily_logs.author_id", userId)
          .neq("user_id", userId)
          .gt("created_at", lastCommentChecked);
        setNewCommentCount(commentCount ?? 0);
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
        const base = updated[logId] ?? emptyReactionSummaries();
        updated[logId] = base.map((r) =>
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
        return updated;
      });

      await toggleReaction(supabase, logId, currentUserId, emoji, wasReacted);
    },
    [currentUserId, reactionMap, supabase]
  );

  const handleAddComment = useCallback(
    async (logId: string, text: string) => {
      if (!currentUserId) return;

      const tempId = `temp-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const tempEntry: CommentEntry = {
        id: tempId,
        logId,
        userId: currentUserId,
        text,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setCommentMap((prev) => ({
        ...prev,
        [logId]: [...(prev[logId] ?? []), tempEntry],
      }));

      try {
        const created = await addComment(supabase, logId, currentUserId, text);
        setCommentMap((prev) => ({
          ...prev,
          [logId]: (prev[logId] ?? []).map((c) =>
            c.id === tempId
              ? { id: created.id, logId: created.log_id, userId: created.user_id, text: created.text, createdAt: created.created_at, updatedAt: created.updated_at }
              : c
          ),
        }));
      } catch {
        setCommentMap((prev) => ({
          ...prev,
          [logId]: (prev[logId] ?? []).filter((c) => c.id !== tempId),
        }));
        toast.error("コメントの投稿に失敗しました");
      }
    },
    [currentUserId, supabase]
  );

  const handleUpdateComment = useCallback(
    async (commentId: string, text: string) => {
      let targetLogId = "";
      let oldText = "";
      for (const [logId, entries] of Object.entries(commentMap)) {
        const found = entries.find((c) => c.id === commentId);
        if (found) {
          targetLogId = logId;
          oldText = found.text;
          break;
        }
      }
      if (!targetLogId) return;

      setCommentMap((prev) => ({
        ...prev,
        [targetLogId]: (prev[targetLogId] ?? []).map((c) =>
          c.id === commentId ? { ...c, text, updatedAt: new Date().toISOString() } : c
        ),
      }));

      try {
        await updateComment(supabase, commentId, text);
      } catch {
        setCommentMap((prev) => ({
          ...prev,
          [targetLogId]: (prev[targetLogId] ?? []).map((c) =>
            c.id === commentId ? { ...c, text: oldText } : c
          ),
        }));
        toast.error("コメントの更新に失敗しました");
      }
    },
    [commentMap, supabase]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      let targetLogId = "";
      let deletedEntry: CommentEntry | undefined;
      for (const [logId, entries] of Object.entries(commentMap)) {
        const found = entries.find((c) => c.id === commentId);
        if (found) {
          targetLogId = logId;
          deletedEntry = found;
          break;
        }
      }
      if (!targetLogId || !deletedEntry) return;

      setCommentMap((prev) => ({
        ...prev,
        [targetLogId]: (prev[targetLogId] ?? []).filter((c) => c.id !== commentId),
      }));

      try {
        await deleteComment(supabase, commentId);
      } catch {
        setCommentMap((prev) => ({
          ...prev,
          [targetLogId]: [...(prev[targetLogId] ?? []), deletedEntry!].sort(
            (a, b) => a.createdAt.localeCompare(b.createdAt)
          ),
        }));
        toast.error("コメントの削除に失敗しました");
      }
    },
    [commentMap, supabase]
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
      <ReactionNotice reactionCount={newReactionCount} commentCount={newCommentCount} />

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
              milestone={milestoneMap[log.id]}
              reactions={reactionMap[log.id]}
              comments={commentMap[log.id]}
              currentUserId={currentUserId}
              nameMap={authorNames}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleReaction={handleToggleReaction}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
