"use client";

import { Suspense, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getWeekRange, toDateString, formatMonthJa } from "@/lib/date";
import { deleteLog } from "@/lib/log-actions";
import { buildReactionMap, toggleReaction, emptyReactionSummaries, type ReactionSummary } from "@/lib/reactions";
import { buildCommentMap, addComment, updateComment, deleteComment, type CommentEntry } from "@/lib/comments";
import { fetchMilestonesByLogIds } from "@/lib/milestones";
import { LogCard } from "@/components/log/log-card";
import { LogForm } from "@/components/log/log-form";
import { LogFilter } from "@/components/log/log-filter";
import { LogsTabs, type LogsTab } from "@/components/log/logs-tabs";
import { WeeklyReportCard } from "@/components/weekly/weekly-report-card";
import { UngeneratedWeekCard } from "@/components/weekly/ungenerated-week-card";
import { MonthlyReportCard } from "@/components/monthly/monthly-report-card";
import { AnnualReportCard } from "@/components/annual/annual-report-card";
import { AnnualAlbumView } from "@/components/annual/annual-album-view";
import { ChildSelector } from "@/components/child/child-selector";
import { ReportPreferencesForm } from "@/components/settings/report-preferences-form";
import { canGenerate, isInCooldown } from "@/lib/annual-report/data";
import { toast } from "sonner";
import { format } from "date-fns";
import { startOfWeek, endOfWeek } from "date-fns";
import type { Child, DailyLog, Milestone, Mood, WeeklyReport, MonthlyReport, AnnualReport } from "@/types";

export default function LogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground">読み込み中...</p>
        </div>
      }
    >
      <LogsPageInner />
    </Suspense>
  );
}

function LogsPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as LogsTab) ?? "logs";
  const validTab = ["logs", "weekly", "monthly", "annual", "report-settings"].includes(initialTab)
    ? initialTab
    : "logs";

  const [activeTab, setActiveTab] = useState<LogsTab>(validTab);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactionMap, setReactionMap] = useState<Record<string, ReactionSummary[]>>({});
  const [commentMap, setCommentMap] = useState<Record<string, CommentEntry[]>>({});
  const [milestoneMap, setMilestoneMap] = useState<Record<string, Milestone>>({});
  const [currentUserId, setCurrentUserId] = useState("");
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();

  // ログフィルター状態
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [milestoneOnly, setMilestoneOnly] = useState(false);
  const [searchText, setSearchText] = useState("");

  // 通信タブ状態
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [annualReports, setAnnualReports] = useState<AnnualReport[]>([]);
  const [viewingAnnual, setViewingAnnual] = useState<AnnualReport | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (
        selectedChildIds.length > 0 &&
        !selectedChildIds.includes(log.child_id)
      )
        return false;
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
      if (milestoneOnly && !milestoneMap[log.id]) return false;
      if (searchText.trim()) {
        const needle = searchText.trim().toLowerCase();
        if (!log.text.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [logs, selectedChildIds, selectedMoods, selectedCategories, milestoneOnly, milestoneMap, searchText]);

  function clearFilters() {
    setSelectedChildIds([]);
    setSelectedMoods([]);
    setSelectedCategories([]);
    setMilestoneOnly(false);
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

    const fetchedLogs = (data as DailyLog[]) ?? [];
    setLogs(fetchedLogs);

    if (fetchedLogs.length > 0) {
      const logIds = fetchedLogs.map((l) => l.id);

      // リアクション再取得
      if (currentUserId) {
        const { data: reactionsData } = await supabase
          .from("log_reactions")
          .select("log_id, user_id, emoji")
          .in("log_id", logIds);
        if (reactionsData) {
          setReactionMap(buildReactionMap(reactionsData, currentUserId));
        }
      }

      // コメント再取得
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
    async function load() {
      const [logsRes, membersRes, childrenRes, weeklyRes, monthlyRes, annualRes, userRes] =
        await Promise.all([
          client
            .from("daily_logs")
            .select("*")
            .order("log_date", { ascending: false })
            .order("created_at", { ascending: false }),
          client.from("family_members").select("user_id, display_name"),
          client
            .from("children")
            .select("*")
            .order("created_at", { ascending: true }),
          client
            .from("weekly_reports")
            .select("*")
            .order("week_start", { ascending: false }),
          client
            .from("monthly_reports")
            .select("*")
            .order("month", { ascending: false }),
          client
            .from("annual_reports")
            .select("*")
            .order("fiscal_year", { ascending: false }),
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
        for (const m of membersRes.data as {
          user_id: string;
          display_name: string | null;
        }[]) {
          if (m.display_name) names[m.user_id] = m.display_name;
        }
        setAuthorNames(names);
      }
      if (!childrenRes.error && childrenRes.data) {
        const children = childrenRes.data as Child[];
        setChildrenList(children);
        if (children.length > 0) {
          setSelectedChildId(children[0].id);
        }
      }
      if (!weeklyRes.error) {
        setReports((weeklyRes.data as WeeklyReport[]) ?? []);
      }
      if (!monthlyRes.error) {
        setMonthlyReports((monthlyRes.data as MonthlyReport[]) ?? []);
      }
      if (!annualRes.error) {
        setAnnualReports((annualRes.data as AnnualReport[]) ?? []);
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

      // lastReactionCheckedAt / lastCommentCheckedAt を更新（ログ一覧を開いた＝確認した）
      const checkedNow = new Date().toISOString();
      localStorage.setItem("lastReactionCheckedAt", checkedNow);
      localStorage.setItem("lastCommentCheckedAt", checkedNow);

      setLoading(false);
    }
    load();
  }, []);

  function handleTabChange(tab: LogsTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "logs") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(`/logs${qs ? `?${qs}` : ""}`);
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
    const log = logs.find((l) => l.id === id);
    const errorMsg = await deleteLog(supabase, id, log?.photo_storage_path ?? null);
    if (errorMsg) {
      toast.error(errorMsg);
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

      // 楽観的更新
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const tempEntry: CommentEntry = {
        id: tempId,
        logId,
        userId: currentUserId,
        text,
        createdAt: now,
        updatedAt: now,
      };
      setCommentMap((prev) => ({
        ...prev,
        [logId]: [...(prev[logId] ?? []), tempEntry],
      }));

      try {
        const created = await addComment(supabase, logId, currentUserId, text);
        // temp を実データで置換
        setCommentMap((prev) => ({
          ...prev,
          [logId]: (prev[logId] ?? []).map((c) =>
            c.id === tempId
              ? { id: created.id, logId: created.log_id, userId: created.user_id, text: created.text, createdAt: created.created_at, updatedAt: created.updated_at }
              : c
          ),
        }));
      } catch {
        // ロールバック
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
      // 対象コメントを探す
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

      // 楽観的更新
      setCommentMap((prev) => ({
        ...prev,
        [targetLogId]: (prev[targetLogId] ?? []).map((c) =>
          c.id === commentId ? { ...c, text, updatedAt: new Date().toISOString() } : c
        ),
      }));

      try {
        await updateComment(supabase, commentId, text);
      } catch {
        // ロールバック
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
      // 対象コメントを探す
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

      // 楽観的更新
      setCommentMap((prev) => ({
        ...prev,
        [targetLogId]: (prev[targetLogId] ?? []).filter((c) => c.id !== commentId),
      }));

      try {
        await deleteComment(supabase, commentId);
      } catch {
        // ロールバック
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

  const [generatingWeek, setGeneratingWeek] = useState<string | null>(null);

  async function handleGenerateWeekly(weekStartOverride?: string, weekEndOverride?: string) {
    const ws = weekStartOverride ?? toDateString(getWeekRange(new Date()).start);
    const we = weekEndOverride ?? toDateString(getWeekRange(new Date()).end);
    setGenerating(true);
    setGeneratingWeek(ws);

    try {
      const res = await fetch("/api/weekly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: ws, weekEnd: we, childId: selectedChildId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "生成に失敗しました");
        return;
      }
      toast.success("週次通信を生成しました");
      router.push(`/weekly/${data.id}`);
    } catch {
      toast.error("生成に失敗しました。再度お試しください");
    } finally {
      setGenerating(false);
      setGeneratingWeek(null);
    }
  }

  async function handleGenerateMonthly() {
    setGenerating(true);
    const now = new Date();
    const month = format(now, "yyyy-MM");

    try {
      const res = await fetch("/api/monthly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, childId: selectedChildId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "生成に失敗しました");
        return;
      }
      toast.success("月次まとめを生成しました");
      router.push(`/weekly/monthly/${data.id}`);
    } catch {
      toast.error("生成に失敗しました。再度お試しください");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateAnnual(fiscalYear: number) {
    setGenerating(true);
    try {
      const res = await fetch("/api/annual-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiscalYear, childId: selectedChildId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "生成に失敗しました");
        return;
      }
      toast.success("年次アルバムを生成しました");
      const newReport = data as AnnualReport;
      setAnnualReports((prev) => {
        const filtered = prev.filter(
          (r) =>
            !(r.child_id === newReport.child_id && r.fiscal_year === newReport.fiscal_year),
        );
        return [newReport, ...filtered];
      });
      setViewingAnnual(newReport);
    } catch {
      toast.error("生成に失敗しました。再度お試しください");
    } finally {
      setGenerating(false);
    }
  }

  // 選択中の子供でフィルター
  const filteredReports = selectedChildId
    ? reports.filter((r) => r.child_id === selectedChildId)
    : reports;
  const filteredMonthlyReports = selectedChildId
    ? monthlyReports.filter((r) => r.child_id === selectedChildId)
    : monthlyReports;
  const filteredAnnualReports = selectedChildId
    ? annualReports.filter((r) => r.child_id === selectedChildId)
    : annualReports;

  // 未生成週の算出: ログがある週のうち、通信が未生成の週を抽出
  const ungeneratedWeeks = useMemo(() => {
    const targetLogs = selectedChildId
      ? logs.filter((l) => l.child_id === selectedChildId)
      : logs;
    if (targetLogs.length === 0) return [];

    // ログがある週を収集（week_start → week_end のマップ）
    const weekMap = new Map<string, string>();
    for (const log of targetLogs) {
      const logDate = new Date(log.log_date + "T00:00:00");
      const ws = toDateString(startOfWeek(logDate, { weekStartsOn: 1 }));
      const we = toDateString(endOfWeek(logDate, { weekStartsOn: 1 }));
      weekMap.set(ws, we);
    }

    // 生成済み週を除外
    const generatedStarts = new Set(filteredReports.map((r) => r.week_start));
    const result: { weekStart: string; weekEnd: string }[] = [];
    for (const [ws, we] of weekMap) {
      if (!generatedStarts.has(ws)) {
        result.push({ weekStart: ws, weekEnd: we });
      }
    }

    // 降順ソート
    result.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    return result;
  }, [logs, selectedChildId, filteredReports]);

  const now = new Date();
  const currentMonthLabel = formatMonthJa(now.getFullYear(), now.getMonth());

  // ヘッダー情報
  const headerInfo: Record<LogsTab, { en: string; ja: string }> = {
    logs: { en: "All Records", ja: "記録一覧" },
    weekly: { en: "Weekly Letters", ja: "週次通信" },
    monthly: { en: "Monthly Essays", ja: "月次まとめ" },
    annual: { en: "Annual Album", ja: "年次アルバム" },
    "report-settings": { en: "Report Settings", ja: "通信設定" },
  };

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
            {headerInfo[activeTab].en}
          </p>
          <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
            {headerInfo[activeTab].ja}
          </h1>
        </div>
        {/* 通信タブ: 生成ボタン */}
        {activeTab === "weekly" && (
          <button
            onClick={() => handleGenerateWeekly()}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <span className="text-base leading-none">✉</span>
                今週（{format(getWeekRange(new Date()).start, "M/d")}〜{format(getWeekRange(new Date()).end, "M/d")}）の通信を作る
              </>
            )}
          </button>
        )}
        {activeTab === "monthly" && (
          <button
            onClick={handleGenerateMonthly}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <span className="text-base leading-none">📖</span>
                {currentMonthLabel}のまとめを作る
              </>
            )}
          </button>
        )}
        {/* 記録タブ: 件数 */}
        {activeTab === "logs" && logs.length > 0 && (
          <span className="font-mono text-2xl font-light leading-none text-muted-foreground/50">
            {String(logs.length).padStart(3, "0")}
          </span>
        )}
      </div>

      {/* タブ切替 */}
      <LogsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* 通信タブ（週次・月次・年次）: 子供セレクター */}
      {(activeTab === "weekly" || activeTab === "monthly" || activeTab === "annual") &&
        childrenList.length >= 2 && (
          <ChildSelector
            childrenList={childrenList}
            selectedId={selectedChildId}
            onChange={setSelectedChildId}
          />
        )}

      <div className="h-px bg-border/60" />

      {/* ===== 記録タブ ===== */}
      {activeTab === "logs" && (
        <>
          {/* フィルター */}
          {logs.length > 0 && (
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
              totalCount={logs.length}
              filteredCount={filteredLogs.length}
              onClear={clearFilters}
            />
          )}

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

          {/* ログ一覧 */}
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-2xl">
                📝
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  まだログがありません
                </p>
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
                  childName={
                    childrenList.length >= 2
                      ? childrenList.find((c) => c.id === log.child_id)?.name
                      : undefined
                  }
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

      {/* ===== 週次通信タブ ===== */}
      {activeTab === "weekly" && (
        <>
          {filteredReports.length === 0 && ungeneratedWeeks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
                <div className="airmail-stripe absolute inset-x-0 top-0 h-2.5" />
                <span className="mt-2 text-3xl">✉</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  まだ週次通信がありません
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  ログを記録したら「今週の通信を作る」を押してみましょう
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 生成済みと未生成を week_start 降順でマージ表示 */}
              {(() => {
                type WeekItem =
                  | { type: "generated"; report: WeeklyReport }
                  | { type: "ungenerated"; weekStart: string; weekEnd: string };

                const items: WeekItem[] = [
                  ...filteredReports.map((r) => ({
                    type: "generated" as const,
                    report: r,
                  })),
                  ...ungeneratedWeeks.map((w) => ({
                    type: "ungenerated" as const,
                    weekStart: w.weekStart,
                    weekEnd: w.weekEnd,
                  })),
                ];

                items.sort((a, b) => {
                  const aStart = a.type === "generated" ? a.report.week_start : a.weekStart;
                  const bStart = b.type === "generated" ? b.report.week_start : b.weekStart;
                  return bStart.localeCompare(aStart);
                });

                return items.map((item) =>
                  item.type === "generated" ? (
                    <WeeklyReportCard key={item.report.id} report={item.report} />
                  ) : (
                    <UngeneratedWeekCard
                      key={`ungenerated-${item.weekStart}`}
                      weekStart={item.weekStart}
                      weekEnd={item.weekEnd}
                      generating={generating && generatingWeek === item.weekStart}
                      onGenerate={handleGenerateWeekly}
                    />
                  )
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* ===== 月次まとめタブ ===== */}
      {activeTab === "monthly" && (
        <>
          {filteredMonthlyReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
                <div className="h-2.5 w-full bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20 absolute inset-x-0 top-0" />
                <span className="mt-2 text-3xl">📖</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  まだ月次まとめがありません
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  週次通信が作られたら「まとめを作る」を押してみましょう
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMonthlyReports.map((report) => (
                <MonthlyReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== 年次アルバムタブ ===== */}
      {activeTab === "annual" && (
        <>
          {viewingAnnual ? (
            <AnnualAlbumView
              report={viewingAnnual}
              onBack={() => setViewingAnnual(null)}
            />
          ) : (
            <AnnualTabContent
              reports={filteredAnnualReports}
              generating={generating}
              onGenerate={handleGenerateAnnual}
              onView={setViewingAnnual}
            />
          )}
        </>
      )}

      {/* ===== 通信設定タブ ===== */}
      {activeTab === "report-settings" && <ReportPreferencesForm />}
    </div>
  );
}

/** 年次タブのコンテンツ（一覧 + 生成ボタン） */
function AnnualTabContent({
  reports,
  generating,
  onGenerate,
  onView,
}: {
  reports: AnnualReport[];
  generating: boolean;
  onGenerate: (fiscalYear: number) => void;
  onView: (report: AnnualReport) => void;
}) {
  const now = new Date();
  // 現在の年度を算出（4月始まり）
  const currentFiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  // 生成可能な最新年度（3月以降なら当年度）
  const latestGeneratable = canGenerate(currentFiscalYear) ? currentFiscalYear : currentFiscalYear - 1;

  // 既に生成済みの年度
  const generatedYears = new Set(reports.map((r) => r.fiscal_year));

  // 生成可能だが未生成の年度を提案（最新1年度のみ）
  const suggestedYear =
    latestGeneratable >= 2020 && !generatedYears.has(latestGeneratable)
      ? latestGeneratable
      : null;

  return (
    <div className="space-y-4">
      {/* 生成ボタン */}
      {suggestedYear !== null && (
        <button
          onClick={() => onGenerate(suggestedYear)}
          disabled={generating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-6 text-sm font-medium text-primary transition-all hover:border-primary/60 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
              生成中...（数十秒かかります）
            </>
          ) : (
            <>
              <span className="text-lg">📚</span>
              {suggestedYear}年度のアルバムを作る
            </>
          )}
        </button>
      )}

      {/* 既に生成済みの年度で再生成可能なものも表示 */}
      {reports.length > 0 && reports.some((r) => !isInCooldown(r.generated_at)) && suggestedYear === null && (
        <button
          onClick={() => {
            const target = reports.find((r) => !isInCooldown(r.generated_at));
            if (target) onGenerate(target.fiscal_year);
          }}
          disabled={generating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card py-3 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 border-t-primary animate-spin" />
              再生成中...
            </>
          ) : (
            "最新のアルバムを再生成する"
          )}
        </button>
      )}

      {/* 生成済みアルバム一覧 */}
      {reports.length === 0 && suggestedYear === null ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
            <div className="h-2.5 w-full bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-amber-300/20 absolute inset-x-0 top-0" />
            <span className="mt-2 text-3xl">📚</span>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              まだ年次アルバムがありません
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              年度末（3月）以降にアルバムを生成できます
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <AnnualReportCard
              key={report.id}
              report={report}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}
