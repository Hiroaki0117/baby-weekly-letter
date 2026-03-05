"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toDateString, getCalendarRange, formatDateJa } from "@/lib/date";
import { deleteLog } from "@/lib/log-actions";
import { buildReactionMap, toggleReaction, emptyReactionSummaries, type ReactionSummary } from "@/lib/reactions";
import { buildCommentMap, addComment, updateComment, deleteComment, type CommentEntry } from "@/lib/comments";
import { fetchMilestonesByLogIds } from "@/lib/milestones";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { LogCard } from "@/components/log/log-card";
import { LogForm } from "@/components/log/log-form";
import { toast } from "sonner";
import type { Child, DailyLog, Milestone } from "@/types";

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [logsByDate, setLogsByDate] = useState<Record<string, DailyLog[]>>({});
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [milestoneMap, setMilestoneMap] = useState<Record<string, Milestone>>({});
  const [reactionMap, setReactionMap] = useState<Record<string, ReactionSummary[]>>({});
  const [commentMap, setCommentMap] = useState<Record<string, CommentEntry[]>>({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const membersFetchedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const { start, end } = getCalendarRange(year, month);
      const startStr = toDateString(start);
      const endStr = toDateString(end);

      const { data, error } = await client
        .from("daily_logs")
        .select("*")
        .gte("log_date", startStr)
        .lte("log_date", endStr)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("ログの取得に失敗しました");
        return;
      }

      const logs = (data as DailyLog[]) ?? [];
      const grouped: Record<string, DailyLog[]> = {};
      for (const log of logs) {
        if (!grouped[log.log_date]) {
          grouped[log.log_date] = [];
        }
        grouped[log.log_date].push(log);
      }
      setLogsByDate(grouped);

      // ユーザーID取得
      const userRes = await client.auth.getUser();
      const userId = userRes.data.user?.id ?? "";
      setCurrentUserId(userId);

      // マイルストーン・リアクション・コメント取得
      if (logs.length > 0) {
        const logIds = logs.map((l) => l.id);
        const msMap = await fetchMilestonesByLogIds(client, logIds);
        setMilestoneMap(msMap);

        if (userId) {
          const { data: reactionsData } = await client
            .from("log_reactions")
            .select("log_id, user_id, emoji")
            .in("log_id", logIds);
          if (reactionsData) {
            setReactionMap(buildReactionMap(reactionsData, userId));
          }
        }

        const { data: commentsData } = await client
          .from("log_comments")
          .select("id, log_id, user_id, text, created_at, updated_at")
          .in("log_id", logIds)
          .order("created_at", { ascending: true });
        if (commentsData) {
          setCommentMap(buildCommentMap(commentsData));
        }
      }

      if (!membersFetchedRef.current) {
        membersFetchedRef.current = true;
        const [membersRes, childrenRes] = await Promise.all([
          client.from("family_members").select("user_id, display_name"),
          client.from("children").select("*").order("created_at", { ascending: true }),
        ]);
        if (membersRes.data) {
          const names: Record<string, string> = {};
          for (const m of membersRes.data as { user_id: string; display_name: string | null }[]) {
            if (m.display_name) names[m.user_id] = m.display_name;
          }
          setAuthorNames(names);
        }
        if (childrenRes.data) {
          setChildrenList(childrenRes.data as Child[]);
        }
      }

      setLoading(false);
    }
    load();
  }, [year, month]);

  function handlePrevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function handleNextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function handleGoToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(null);
  }

  function handleSelectMonth(y: number, m: number) {
    setYear(y);
    setMonth(m);
    setSelectedDate(null);
  }

  function handleSelectDate(dateStr: string) {
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  }

  const selectedLogs = selectedDate ? (logsByDate[selectedDate] ?? []) : [];
  const supabase = supabaseRef.current;

  async function reloadMonth() {
    const { start, end } = getCalendarRange(year, month);
    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .gte("log_date", toDateString(start))
      .lte("log_date", toDateString(end))
      .order("created_at", { ascending: true });

    const logs = (data as DailyLog[]) ?? [];
    const grouped: Record<string, DailyLog[]> = {};
    for (const log of logs) {
      if (!grouped[log.log_date]) grouped[log.log_date] = [];
      grouped[log.log_date].push(log);
    }
    setLogsByDate(grouped);

    if (logs.length > 0) {
      const logIds = logs.map((l) => l.id);
      const msMap = await fetchMilestonesByLogIds(supabase, logIds);
      setMilestoneMap(msMap);

      if (currentUserId) {
        const { data: reactionsData } = await supabase
          .from("log_reactions")
          .select("log_id, user_id, emoji")
          .in("log_id", logIds);
        if (reactionsData) {
          setReactionMap(buildReactionMap(reactionsData, currentUserId));
        }
      }

      const { data: commentsData } = await supabase
        .from("log_comments")
        .select("id, log_id, user_id, text, created_at, updated_at")
        .in("log_id", logIds)
        .order("created_at", { ascending: true });
      if (commentsData) {
        setCommentMap(buildCommentMap(commentsData));
      }
    }
  }

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
    const allLogs = Object.values(logsByDate).flat();
    const log = allLogs.find((l) => l.id === id);
    const errorMsg = await deleteLog(supabase, id, log?.photo_storage_path ?? null);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    toast.success("ログを削除しました");
    reloadMonth();
  }

  function handleSaved() {
    setEditingLog(null);
    setEditingPhotoUrl(null);
    reloadMonth();
    router.refresh();
  }

  async function handleToggleReaction(logId: string, emoji: string) {
    if (!currentUserId) return;
    const current = reactionMap[logId] ?? [];
    const summary = current.find((r) => r.emoji === emoji);
    const wasReacted = summary?.reacted ?? false;

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
  }

  async function handleAddComment(logId: string, text: string) {
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
  }

  async function handleUpdateComment(commentId: string, text: string) {
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
  }

  async function handleDeleteComment(commentId: string) {
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
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Calendar
        </p>
        <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
          カレンダー
        </h1>
      </div>

      <div className="h-px bg-border/60" />

      {/* カレンダーグリッド */}
      <CalendarGrid
        year={year}
        month={month}
        logsByDate={logsByDate}
        milestoneMap={milestoneMap}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isCurrentMonth={isCurrentMonth}
        onGoToToday={handleGoToToday}
        onSelectMonth={handleSelectMonth}
      />

      {/* 選択日のログ一覧 */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {formatDateJa(selectedDate)}
              {selectedLogs.length > 0
                ? ` ・ ${selectedLogs.length}件`
                : ""}
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {/* 編集フォーム */}
          {editingLog && (
            <LogForm
              key={editingLog.id}
              childrenList={childrenList}
              editingLog={editingLog}
              existingPhotoUrl={editingPhotoUrl}
              onSaved={handleSaved}
              onCancel={() => {
                setEditingLog(null);
                setEditingPhotoUrl(null);
              }}
            />
          )}

          {selectedLogs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                この日のログはありません
              </p>
            </div>
          ) : (
            selectedLogs.map((log) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
