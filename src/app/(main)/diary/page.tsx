"use client";

import { Suspense, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toDateString, getCalendarRange, formatDateJa } from "@/lib/date";
import { deleteLog } from "@/lib/log-actions";
import { buildReactionMap, toggleReaction, emptyReactionSummaries, type ReactionSummary } from "@/lib/reactions";
import { buildCommentMap, addComment, updateComment, deleteComment, type CommentEntry } from "@/lib/comments";
import { fetchMilestonesByLogIds } from "@/lib/milestones";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { LogCard } from "@/components/log/log-card";
import { LogForm } from "@/components/log/log-form";
import { LogFilter } from "@/components/log/log-filter";
import { Calendar, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import type { Child, DailyLog, Milestone, Mood } from "@/types";

type ViewMode = "calendar" | "list";

export default function DiaryPage() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner />
      }
    >
      <DiaryPageInner />
    </Suspense>
  );
}

function DiaryPageInner() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as ViewMode) ?? "calendar";
  const validView = ["calendar", "list"].includes(initialView) ? initialView : "calendar";

  const [viewMode, setViewMode] = useState<ViewMode>(validView);
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // 共通状態
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [milestoneMap, setMilestoneMap] = useState<Record<string, Milestone>>({});
  const [reactionMap, setReactionMap] = useState<Record<string, ReactionSummary[]>>({});
  const [commentMap, setCommentMap] = useState<Record<string, CommentEntry[]>>({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const membersFetchedRef = useRef(false);

  // カレンダー表示用
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [calendarLogsByDate, setCalendarLogsByDate] = useState<Record<string, DailyLog[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 一覧表示用
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [milestoneOnly, setMilestoneOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [listLoaded, setListLoaded] = useState(false);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (selectedChildIds.length > 0 && !selectedChildIds.includes(log.child_id)) return false;
      if (selectedMoods.length > 0 && !selectedMoods.includes(log.mood as Mood)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.some((c) => log.categories.includes(c))) return false;
      if (milestoneOnly && !milestoneMap[log.id]) return false;
      if (searchText.trim()) {
        const needle = searchText.trim().toLowerCase();
        if (!log.text.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [allLogs, selectedChildIds, selectedMoods, selectedCategories, milestoneOnly, milestoneMap, searchText]);

  function clearFilters() {
    setSelectedChildIds([]);
    setSelectedMoods([]);
    setSelectedCategories([]);
    setMilestoneOnly(false);
    setSearchText("");
  }

  // カレンダーデータ読み込み
  useEffect(() => {
    async function loadCalendar() {
      const client = supabaseRef.current;
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
        if (!grouped[log.log_date]) grouped[log.log_date] = [];
        grouped[log.log_date].push(log);
      }
      setCalendarLogsByDate(grouped);

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
    loadCalendar();
  }, [year, month]);

  // 一覧データ読み込み（一覧に切り替えたときに一度だけ）
  useEffect(() => {
    if (viewMode !== "list" || listLoaded) return;
    async function loadList() {
      const client = supabaseRef.current;
      const { data, error } = await client
        .from("daily_logs")
        .select("*")
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("ログの取得に失敗しました");
        return;
      }

      const fetchedLogs = (data as DailyLog[]) ?? [];
      setAllLogs(fetchedLogs);

      if (fetchedLogs.length > 0) {
        const logIds = fetchedLogs.map((l) => l.id);

        if (currentUserId) {
          const { data: reactionsData } = await client
            .from("log_reactions")
            .select("log_id, user_id, emoji")
            .in("log_id", logIds);
          if (reactionsData) {
            setReactionMap(buildReactionMap(reactionsData, currentUserId));
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

        const msMap = await fetchMilestonesByLogIds(client, logIds);
        setMilestoneMap(msMap);
      }

      setListLoaded(true);
    }
    loadList();
  }, [viewMode, listLoaded, currentUserId]);

  // カレンダーナビゲーション
  function handlePrevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); } else { setMonth(month - 1); }
    setSelectedDate(null);
  }
  function handleNextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); } else { setMonth(month + 1); }
    setSelectedDate(null);
  }
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  function handleGoToToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDate(null); }
  function handleSelectMonth(y: number, m: number) { setYear(y); setMonth(m); setSelectedDate(null); }
  function handleSelectDate(dateStr: string) { setSelectedDate(selectedDate === dateStr ? null : dateStr); }
  const selectedLogs = selectedDate ? (calendarLogsByDate[selectedDate] ?? []) : [];

  // カレンダーデータリロード
  async function reloadCalendar() {
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
    setCalendarLogsByDate(grouped);

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

  // 一覧データリロード
  async function reloadList() {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return;

    const fetchedLogs = (data as DailyLog[]) ?? [];
    setAllLogs(fetchedLogs);

    if (fetchedLogs.length > 0) {
      const logIds = fetchedLogs.map((l) => l.id);
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
      const msMap = await fetchMilestonesByLogIds(supabase, logIds);
      setMilestoneMap(msMap);
    }
  }

  // 編集・削除ハンドラ
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
    const allLogsFlat = viewMode === "calendar"
      ? Object.values(calendarLogsByDate).flat()
      : allLogs;
    const log = allLogsFlat.find((l) => l.id === id);
    const errorMsg = await deleteLog(supabase, id, log?.photo_storage_path ?? null);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    toast.success("ログを削除しました");
    if (viewMode === "calendar") {
      reloadCalendar();
    } else {
      reloadList();
    }
  }

  function handleSaved() {
    setEditingLog(null);
    setEditingPhotoUrl(null);
    if (viewMode === "calendar") {
      reloadCalendar();
    } else {
      reloadList();
    }
    router.refresh();
  }

  // リアクション・コメントハンドラ
  const handleToggleReaction = useCallback(
    async (logId: string, emoji: string) => {
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
    },
    [currentUserId, reactionMap, supabase]
  );

  const handleAddComment = useCallback(
    async (logId: string, text: string) => {
      if (!currentUserId) return;
      const tempId = `temp-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const tempEntry: CommentEntry = { id: tempId, logId, userId: currentUserId, text, createdAt: nowIso, updatedAt: nowIso };
      setCommentMap((prev) => ({ ...prev, [logId]: [...(prev[logId] ?? []), tempEntry] }));

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
        setCommentMap((prev) => ({ ...prev, [logId]: (prev[logId] ?? []).filter((c) => c.id !== tempId) }));
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
        if (found) { targetLogId = logId; oldText = found.text; break; }
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
        if (found) { targetLogId = logId; deletedEntry = found; break; }
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

  // ビュー切り替え
  function handleViewChange(mode: ViewMode) {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "calendar") {
      params.delete("view");
    } else {
      params.set("view", mode);
    }
    const qs = params.toString();
    router.replace(`/diary${qs ? `?${qs}` : ""}`, { scroll: false });
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
      <PageHeader englishLabel="Diary" title="日記">

        {/* 表示切り替えトグル */}
        <div className="flex rounded-lg border border-border/60 p-0.5">
          <button
            type="button"
            onClick={() => handleViewChange("calendar")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              viewMode === "calendar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Calendar size={14} />
            カレンダー
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("list")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List size={14} />
            一覧
          </button>
        </div>
      </PageHeader>

      <div className="h-px bg-border/60" />

      {/* ===== カレンダー表示 ===== */}
      {viewMode === "calendar" && (
        <>
          <CalendarGrid
            year={year}
            month={month}
            logsByDate={calendarLogsByDate}
            milestoneMap={milestoneMap}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            isCurrentMonth={isCurrentMonth}
            onGoToToday={handleGoToToday}
            onSelectMonth={handleSelectMonth}
          />

          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {formatDateJa(selectedDate)}
                  {selectedLogs.length > 0 ? ` ・ ${selectedLogs.length}件` : ""}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              {editingLog && (
                <LogForm
                  key={editingLog.id}
                  childrenList={childrenList}
                  editingLog={editingLog}
                  existingPhotoUrl={editingPhotoUrl}
                  onSaved={handleSaved}
                  onCancel={() => { setEditingLog(null); setEditingPhotoUrl(null); }}
                />
              )}

              {selectedLogs.length === 0 ? (
                <EmptyState title="この日のログはありません" className="py-8" />
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
        </>
      )}

      {/* ===== 一覧表示 ===== */}
      {viewMode === "list" && (
        <>
          {allLogs.length > 0 && (
            <LogFilter
              childrenList={childrenList}
              selectedChildIds={selectedChildIds}
              onChildIdsChange={setSelectedChildIds}
              selectedMoods={selectedMoods}
              onMoodsChange={setSelectedMoods}
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
              milestoneOnly={milestoneOnly}
              onMilestoneOnlyChange={setMilestoneOnly}
              searchText={searchText}
              onSearchTextChange={setSearchText}
              totalCount={allLogs.length}
              filteredCount={filteredLogs.length}
              onClear={clearFilters}
            />
          )}

          {editingLog && (
            <LogForm
              key={editingLog.id}
              childrenList={childrenList}
              editingLog={editingLog}
              existingPhotoUrl={editingPhotoUrl}
              existingMilestone={milestoneMap[editingLog.id] ?? null}
              onSaved={handleSaved}
              onCancel={() => { setEditingLog(null); setEditingPhotoUrl(null); }}
            />
          )}

          {allLogs.length === 0 ? (
            <EmptyState
              emoji="📝"
              title="まだログがありません"
              subtitle="ホームから最初の日記を残してみましょう"
            />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title="条件に合うログがありません"
              className="py-16"
              action={
                <button type="button" onClick={clearFilters} className="mt-2 text-xs text-primary transition-colors hover:text-primary/80">
                  フィルターをクリア
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
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
        </>
      )}
    </div>
  );
}
