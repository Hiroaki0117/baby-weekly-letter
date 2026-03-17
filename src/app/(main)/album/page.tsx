"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getWeekRange, toDateString, formatMonthJa } from "@/lib/date";
import { groupPhotosByMonth, type MonthGroup } from "@/lib/gallery";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { PhotoModal } from "@/components/gallery/photo-modal";
import { GeneratingOverlay } from "@/components/ui/generating-overlay";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { WeeklyReportCard } from "@/components/weekly/weekly-report-card";
import { UngeneratedWeekCard } from "@/components/weekly/ungenerated-week-card";
import { MonthlyReportCard } from "@/components/monthly/monthly-report-card";
import { AnnualReportCard } from "@/components/annual/annual-report-card";
import { AnnualAlbumView } from "@/components/annual/annual-album-view";
import { ChildSelector } from "@/components/child/child-selector";
import { ReportPreferencesForm } from "@/components/settings/report-preferences-form";
import { canGenerate, isInCooldown } from "@/lib/annual-report/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { startOfWeek, endOfWeek } from "date-fns";
import type { Child, DailyLog, WeeklyReport, MonthlyReport, AnnualReport } from "@/types";

type AlbumTab = "photos" | "weekly" | "monthly" | "annual" | "settings";
type TopCategory = "photos" | "albums";

const albumSubTabs: { key: AlbumTab; label: string; icon: string }[] = [
  { key: "weekly", label: "週次", icon: "✉" },
  { key: "monthly", label: "月次", icon: "📖" },
  { key: "annual", label: "年次", icon: "📚" },
  { key: "settings", label: "設定", icon: "⚙" },
];

function getTopCategory(tab: AlbumTab): TopCategory {
  return tab === "photos" ? "photos" : "albums";
}

export default function AlbumPage() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner />
      }
    >
      <AlbumPageInner />
    </Suspense>
  );
}

function AlbumPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AlbumTab) ?? "photos";
  const allTabs: AlbumTab[] = ["photos", "weekly", "monthly", "annual", "settings"];
  const validTab = allTabs.includes(initialTab) ? initialTab : "photos";

  const [activeTab, setActiveTab] = useState<AlbumTab>(validTab);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const supabaseRef = useRef(createClient());
  const router = useRouter();

  // データ
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [annualReports, setAnnualReports] = useState<AnnualReport[]>([]);
  const [viewingAnnual, setViewingAnnual] = useState<AnnualReport | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [photoMonths, setPhotoMonths] = useState<MonthGroup[]>([]);
  const [photoModal, setPhotoModal] = useState<{
    imageUrl: string;
    logDate: string;
    text: string;
    mood: string;
    childName?: string;
  } | null>(null);
  const [generatingWeek, setGeneratingWeek] = useState<string | null>(null);

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const [logsRes, childrenRes, weeklyRes, monthlyRes, annualRes, photoLogsRes] =
        await Promise.all([
          client
            .from("daily_logs")
            .select("*")
            .order("log_date", { ascending: false })
            .order("created_at", { ascending: false }),
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
          client
            .from("daily_logs")
            .select("id, log_date, text, mood, child_id, photo_storage_path")
            .not("photo_storage_path", "is", null)
            .order("log_date", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

      if (!logsRes.error) setLogs((logsRes.data as DailyLog[]) ?? []);
      if (!childrenRes.error && childrenRes.data) {
        const children = childrenRes.data as Child[];
        setChildrenList(children);
        if (children.length > 0) setSelectedChildId(children[0].id);
      }
      if (!weeklyRes.error) setReports((weeklyRes.data as WeeklyReport[]) ?? []);
      if (!monthlyRes.error) setMonthlyReports((monthlyRes.data as MonthlyReport[]) ?? []);
      if (!annualRes.error) setAnnualReports((annualRes.data as AnnualReport[]) ?? []);
      if (!photoLogsRes.error && photoLogsRes.data) {
        setPhotoMonths(
          groupPhotosByMonth(
            photoLogsRes.data as {
              id: string;
              log_date: string;
              text: string;
              mood: string;
              child_id: string;
              photo_storage_path: string;
            }[],
          ),
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  function handleTabChange(tab: AlbumTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "photos") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(`/album${qs ? `?${qs}` : ""}`, { scroll: false });
  }

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
      toast.success("週次アルバムを生成しました");
      router.push(`/album/weekly/${data.id}`);
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
      toast.success("月次アルバムを生成しました");
      router.push(`/album/monthly/${data.id}`);
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
          (r) => !(r.child_id === newReport.child_id && r.fiscal_year === newReport.fiscal_year),
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

  // 未生成週の算出
  const ungeneratedWeeks = useMemo(() => {
    const targetLogs = selectedChildId
      ? logs.filter((l) => l.child_id === selectedChildId)
      : logs;
    if (targetLogs.length === 0) return [];

    const weekMap = new Map<string, string>();
    for (const log of targetLogs) {
      const logDate = new Date(log.log_date + "T00:00:00");
      const ws = toDateString(startOfWeek(logDate, { weekStartsOn: 1 }));
      const we = toDateString(endOfWeek(logDate, { weekStartsOn: 1 }));
      weekMap.set(ws, we);
    }

    const generatedStarts = new Set(filteredReports.map((r) => r.week_start));
    const result: { weekStart: string; weekEnd: string }[] = [];
    for (const [ws, we] of weekMap) {
      if (!generatedStarts.has(ws)) {
        result.push({ weekStart: ws, weekEnd: we });
      }
    }
    result.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    return result;
  }, [logs, selectedChildId, filteredReports]);

  const now = new Date();
  const currentMonthLabel = formatMonthJa(now.getFullYear(), now.getMonth());

  // ヘッダー情報
  const headerInfo: Record<AlbumTab, { en: string; ja: string }> = {
    photos: { en: "Photos", ja: "写真ギャラリー" },
    weekly: { en: "Weekly Album", ja: "週次アルバム" },
    monthly: { en: "Monthly Album", ja: "月次アルバム" },
    annual: { en: "Annual Album", ja: "年次アルバム" },
    settings: { en: "Album Settings", ja: "アルバム設定" },
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
      <GeneratingOverlay visible={generating} />

      {/* ページヘッダー */}
      <PageHeader englishLabel={headerInfo[activeTab].en} title={headerInfo[activeTab].ja}>
        {/* 生成ボタン */}
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
                今週（{format(getWeekRange(new Date()).start, "M/d")}〜{format(getWeekRange(new Date()).end, "M/d")}）のアルバムを作る
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
                {currentMonthLabel}のアルバムを作る
              </>
            )}
          </button>
        )}
        {/* 写真タブ: 件数 */}
        {activeTab === "photos" && photoMonths.length > 0 && (
          <span className="font-mono text-2xl font-light leading-none text-muted-foreground/50">
            {String(photoMonths.reduce((sum, m) => sum + m.photos.length, 0)).padStart(3, "0")}
          </span>
        )}
      </PageHeader>

      {/* タブ切替（2段構成） */}
      <div className="space-y-3">
        {/* 大項目: 写真 / アルバム */}
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          <button
            onClick={() => handleTabChange("photos")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              getTopCategory(activeTab) === "photos"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            📸 写真
          </button>
          <button
            onClick={() => { if (activeTab === "photos") handleTabChange("weekly"); }}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              getTopCategory(activeTab) === "albums"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            📚 アルバム
          </button>
        </div>

        {/* 小項目: アルバムカテゴリ選択時のみ */}
        {getTopCategory(activeTab) === "albums" && (
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {albumSubTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 子供セレクター */}
      {(activeTab === "weekly" || activeTab === "monthly" || activeTab === "annual") &&
        childrenList.length >= 2 && (
          <ChildSelector
            childrenList={childrenList}
            selectedId={selectedChildId}
            onChange={setSelectedChildId}
          />
        )}

      <div className="h-px bg-border/60" />

      {/* ===== 写真タブ ===== */}
      {activeTab === "photos" && (
        <>
          {photoMonths.length === 0 ? (
            <EmptyState
              emoji="📷"
              title="まだ写真がありません"
              subtitle="日記に写真を添付してみましょう"
            />
          ) : (
            <PhotoGrid
              months={photoMonths}
              childrenMap={new Map(childrenList.map((c) => [c.id, c.name ?? ""]))}
              showChildBadge={childrenList.length >= 2}
              onSelect={setPhotoModal}
            />
          )}

          {photoModal && (
            <PhotoModal
              imageUrl={photoModal.imageUrl}
              logDate={photoModal.logDate}
              text={photoModal.text}
              mood={photoModal.mood}
              childName={photoModal.childName}
              onClose={() => setPhotoModal(null)}
            />
          )}
        </>
      )}

      {/* ===== 週次アルバムタブ ===== */}
      {activeTab === "weekly" && (
        <>
          {filteredReports.length === 0 && ungeneratedWeeks.length === 0 ? (
            <EmptyState
              icon={
                <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <div className="airmail-stripe absolute inset-x-0 top-0 h-2.5" />
                  <span className="mt-2 text-3xl">✉</span>
                </div>
              }
              title="まだ週次アルバムがありません"
              subtitle="日記を書いたら「今週のアルバムを作る」を押してみましょう"
            />
          ) : (
            <div className="space-y-3">
              {(() => {
                type WeekItem =
                  | { type: "generated"; report: WeeklyReport }
                  | { type: "ungenerated"; weekStart: string; weekEnd: string };

                const items: WeekItem[] = [
                  ...filteredReports.map((r) => ({ type: "generated" as const, report: r })),
                  ...ungeneratedWeeks.map((w) => ({ type: "ungenerated" as const, weekStart: w.weekStart, weekEnd: w.weekEnd })),
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

      {/* ===== 月次アルバムタブ ===== */}
      {activeTab === "monthly" && (
        <>
          {filteredMonthlyReports.length === 0 ? (
            <EmptyState
              icon={
                <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <div className="h-2.5 w-full bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20 absolute inset-x-0 top-0" />
                  <span className="mt-2 text-3xl">📖</span>
                </div>
              }
              title="まだ月次アルバムがありません"
              subtitle="週次アルバムが作られたら「アルバムを作る」を押してみましょう"
            />
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

      {/* ===== アルバム設定タブ ===== */}
      {activeTab === "settings" && <ReportPreferencesForm />}
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
  const currentFiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const latestGeneratable = canGenerate(currentFiscalYear) ? currentFiscalYear : currentFiscalYear - 1;
  const generatedYears = new Set(reports.map((r) => r.fiscal_year));
  const suggestedYear =
    latestGeneratable >= 2020 && !generatedYears.has(latestGeneratable)
      ? latestGeneratable
      : null;

  return (
    <div className="space-y-4">
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

      {reports.length === 0 && suggestedYear === null ? (
        <EmptyState
          icon={
            <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
              <div className="h-2.5 w-full bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-amber-300/20 absolute inset-x-0 top-0" />
              <span className="mt-2 text-3xl">📚</span>
            </div>
          }
          title="まだ年次アルバムがありません"
          subtitle="年度末（3月）以降にアルバムを生成できます"
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <AnnualReportCard key={report.id} report={report} onView={onView} />
          ))}
        </div>
      )}
    </div>
  );
}
