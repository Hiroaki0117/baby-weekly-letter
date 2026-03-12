import { SupabaseClient } from "@supabase/supabase-js";
import { startOfWeek, endOfWeek, lastDayOfMonth } from "date-fns";
import { toDateString, getMonthRange, formatMonthJa } from "@/lib/date";
import { formatWeekRange } from "@/lib/date";
import { generateWeeklyReport } from "@/lib/weekly-report/generate";
import { generateMonthlyReport } from "@/lib/monthly-report/generate";
import { generateAnnualReport } from "@/lib/annual-report/generate";
import {
  getFiscalYearRange,
  canGenerate,
  getMonthlyPhotoPaths,
  getGrowthSummary,
} from "@/lib/annual-report/data";
import { calcAge } from "@/lib/date";
import { DEFAULT_PREFERENCES } from "@/lib/report-preferences";
import type {
  Child,
  DailyLog,
  WeeklyReport,
  MonthlyReport,
  Milestone,
  ReportPreferences,
  ReportTone,
  ReportSection,
  AnnualReportContent,
} from "@/types";
import type { Database } from "@/types/database";

type SBClient = SupabaseClient<Database>;

// ------------------------------------------------------------------
// ヘルパー: 結びの文を抽出
// ------------------------------------------------------------------
function extractEnding(content: string): string {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines[lines.length - 1] ?? "";
}

// ------------------------------------------------------------------
// 自動生成が有効な家族IDを取得
// ------------------------------------------------------------------
export async function getAutoGenerateFamilies(
  supabase: SBClient,
): Promise<string[]> {
  const { data: families } = await supabase.from("families").select("id");
  if (!families) return [];

  const familyIds: string[] = [];
  for (const family of families) {
    const { data: members } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", family.id);

    if (!members || members.length === 0) continue;

    const userIds = members.map((m) => m.user_id);
    const { data: prefs } = await supabase
      .from("report_preferences")
      .select("auto_generate")
      .in("user_id", userIds);

    // 設定レコードがない（デフォルト true）か、明示的に true がある
    const allExplicitlyFalse =
      prefs &&
      prefs.length === userIds.length &&
      prefs.every((p) => p.auto_generate === false);

    if (!allExplicitlyFalse) {
      familyIds.push(family.id);
    }
  }

  return familyIds;
}

// ------------------------------------------------------------------
// 家族単位の preferences 取得
// ------------------------------------------------------------------
async function fetchPreferencesForFamily(
  supabase: SBClient,
  familyId: string,
): Promise<ReportPreferences> {
  const { data: members } = await supabase
    .from("family_members")
    .select("user_id")
    .eq("family_id", familyId);

  if (!members || members.length === 0) return DEFAULT_PREFERENCES;

  const userIds = members.map((m) => m.user_id);
  const { data: pref } = await supabase
    .from("report_preferences")
    .select("tone, sections")
    .in("user_id", userIds)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pref) return DEFAULT_PREFERENCES;

  return {
    tone: pref.tone as ReportTone,
    sections: pref.sections as ReportSection[],
  };
}

// ------------------------------------------------------------------
// 通知挿入
// ------------------------------------------------------------------
async function insertNotification(
  supabase: SBClient,
  familyId: string,
  type: string,
  title: string,
  link: string,
): Promise<void> {
  await supabase.from("notifications").insert({
    family_id: familyId,
    user_id: null,
    type,
    title,
    link,
  });
}

// ------------------------------------------------------------------
// 週次アルバム自動生成
// ------------------------------------------------------------------
export async function processWeekly(
  supabase: SBClient,
  familyIds: string[],
  jstNow: Date,
): Promise<{ generated: number; skipped: number }> {
  const weekStart = startOfWeek(jstNow, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(jstNow, { weekStartsOn: 1 });
  const weekStartStr = toDateString(weekStart);
  const weekEndStr = toDateString(weekEnd);

  let generated = 0;
  let skipped = 0;

  for (const familyId of familyIds) {
    const { data: children } = await supabase
      .from("children")
      .select("*")
      .eq("family_id", familyId);

    if (!children) continue;

    for (const child of children as Child[]) {
      try {
        // 既に生成済みならスキップ
        const { data: existing } = await supabase
          .from("weekly_reports")
          .select("id")
          .eq("family_id", familyId)
          .eq("child_id", child.id)
          .eq("week_start", weekStartStr)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // ログ件数チェック（3件以上）
        const { count } = await supabase
          .from("daily_logs")
          .select("id", { count: "exact", head: true })
          .eq("child_id", child.id)
          .gte("log_date", weekStartStr)
          .lte("log_date", weekEndStr);

        if (!count || count < 3) {
          skipped++;
          continue;
        }

        // ログ取得
        const { data: logs } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("child_id", child.id)
          .gte("log_date", weekStartStr)
          .lte("log_date", weekEndStr)
          .order("log_date", { ascending: true });

        if (!logs || logs.length === 0) {
          skipped++;
          continue;
        }

        // 前回の週次アルバムの結び
        const { data: prevReport } = await supabase
          .from("weekly_reports")
          .select("content")
          .eq("child_id", child.id)
          .lt("week_start", weekStartStr)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        const previousEnding = prevReport
          ? extractEnding(prevReport.content)
          : null;

        const preferences = await fetchPreferencesForFamily(supabase, familyId);

        const content = await generateWeeklyReport(
          logs as DailyLog[],
          weekStartStr,
          weekEndStr,
          {
            childName: child.name,
            childBirthDate: child.birth_date,
            previousReportEnding: previousEnding,
          },
          preferences,
        );

        const typedLogs = logs as DailyLog[];
        const sourceLogIds = typedLogs.map((l) => l.id);

        const { data: report } = await supabase
          .from("weekly_reports")
          .upsert(
            {
              family_id: familyId,
              child_id: child.id,
              week_start: weekStartStr,
              week_end: weekEndStr,
              content,
              generated_at: new Date().toISOString(),
              source_log_ids: sourceLogIds,
            },
            { onConflict: "family_id,child_id,week_start" },
          )
          .select()
          .single();

        if (report) {
          const rangeLabel = formatWeekRange(weekStartStr, weekEndStr);
          await insertNotification(
            supabase,
            familyId,
            "auto_weekly",
            `${rangeLabel}の週次アルバムが作成されました`,
            `/weekly/${report.id}`,
          );
          generated++;
        }
      } catch (error) {
        console.error(
          `Weekly auto-generate failed: family=${familyId} child=${child.id}`,
          error,
        );
      }
    }
  }

  return { generated, skipped };
}

// ------------------------------------------------------------------
// 月次アルバム自動生成
// ------------------------------------------------------------------
export async function processMonthly(
  supabase: SBClient,
  familyIds: string[],
  jstNow: Date,
): Promise<{ generated: number; skipped: number }> {
  const year = jstNow.getFullYear();
  const month = jstNow.getMonth(); // 0-11
  const { start: monthStart, end: monthEnd } = getMonthRange(year, month);
  const monthDate = toDateString(monthStart); // "YYYY-MM-01"

  let generated = 0;
  let skipped = 0;

  for (const familyId of familyIds) {
    const { data: children } = await supabase
      .from("children")
      .select("*")
      .eq("family_id", familyId);

    if (!children) continue;

    for (const child of children as Child[]) {
      try {
        // 既に生成済みならスキップ
        const { data: existing } = await supabase
          .from("monthly_reports")
          .select("id")
          .eq("family_id", familyId)
          .eq("child_id", child.id)
          .eq("month", monthDate)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // 当月の週次アルバムを取得
        const { data: weeklyReports } = await supabase
          .from("weekly_reports")
          .select("*")
          .eq("child_id", child.id)
          .gte("week_start", toDateString(monthStart))
          .lte("week_start", toDateString(monthEnd))
          .order("week_start", { ascending: true });

        if (!weeklyReports || weeklyReports.length === 0) {
          skipped++;
          continue;
        }

        const typedReports = weeklyReports as WeeklyReport[];

        // 前月の月次アルバムの結び
        const { data: prevMonthly } = await supabase
          .from("monthly_reports")
          .select("content")
          .eq("child_id", child.id)
          .lt("month", monthDate)
          .order("month", { ascending: false })
          .limit(1)
          .maybeSingle();

        const previousEnding = prevMonthly
          ? extractEnding(prevMonthly.content)
          : null;

        const preferences = await fetchPreferencesForFamily(supabase, familyId);

        const content = await generateMonthlyReport(
          typedReports,
          year,
          month,
          {
            childName: child.name,
            childBirthDate: child.birth_date,
            previousMonthlyEnding: previousEnding,
          },
          preferences,
        );

        const sourceWeeklyReportIds = typedReports.map((r) => r.id);

        const { data: report } = await supabase
          .from("monthly_reports")
          .upsert(
            {
              family_id: familyId,
              child_id: child.id,
              month: monthDate,
              content,
              generated_at: new Date().toISOString(),
              source_weekly_report_ids: sourceWeeklyReportIds,
            },
            { onConflict: "family_id,child_id,month" },
          )
          .select()
          .single();

        if (report) {
          const monthLabel = formatMonthJa(year, month);
          await insertNotification(
            supabase,
            familyId,
            "auto_monthly",
            `${monthLabel}の月次アルバムが作成されました`,
            `/weekly/monthly/${report.id}`,
          );
          generated++;
        }
      } catch (error) {
        console.error(
          `Monthly auto-generate failed: family=${familyId} child=${child.id}`,
          error,
        );
      }
    }
  }

  return { generated, skipped };
}

// ------------------------------------------------------------------
// 年次アルバム自動生成
// ------------------------------------------------------------------
export async function processAnnual(
  supabase: SBClient,
  familyIds: string[],
  jstNow: Date,
): Promise<{ generated: number; skipped: number }> {
  const fiscalYear = jstNow.getFullYear() - 1; // 3月31日 → 前年度

  if (!canGenerate(fiscalYear, jstNow)) {
    return { generated: 0, skipped: 0 };
  }

  const { start, end } = getFiscalYearRange(fiscalYear);

  let generated = 0;
  let skipped = 0;

  for (const familyId of familyIds) {
    const { data: children } = await supabase
      .from("children")
      .select("*")
      .eq("family_id", familyId);

    if (!children) continue;

    for (const child of children as Child[]) {
      try {
        // 既に生成済みならスキップ
        const { data: existing } = await supabase
          .from("annual_reports")
          .select("id")
          .eq("family_id", familyId)
          .eq("child_id", child.id)
          .eq("fiscal_year", fiscalYear)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // 月次アルバム取得
        const { data: monthlyData } = await supabase
          .from("monthly_reports")
          .select("*")
          .eq("child_id", child.id)
          .gte("month", start)
          .lte("month", end)
          .order("month", { ascending: true });

        const monthlyReports = (monthlyData ?? []) as MonthlyReport[];

        // 週次アルバム取得（月次がない月のフォールバック用）
        const { data: weeklyData } = await supabase
          .from("weekly_reports")
          .select("*")
          .eq("child_id", child.id)
          .gte("week_start", start)
          .lte("week_start", end)
          .order("week_start", { ascending: true });

        const weeklyReports = (weeklyData ?? []) as WeeklyReport[];

        // データ存在チェック（月次1件以上）
        if (monthlyReports.length === 0) {
          skipped++;
          continue;
        }

        // マイルストーン取得
        const { data: milestoneData } = await supabase
          .from("milestones")
          .select("*")
          .eq("child_id", child.id)
          .gte("milestone_date", start)
          .lte("milestone_date", end)
          .order("milestone_date", { ascending: true });

        const milestones = (milestoneData ?? []) as Milestone[];

        // 成長データ・写真パス取得
        const [growthSummary, monthlyPhotos] = await Promise.all([
          getGrowthSummary(supabase, child.id, start, end),
          getMonthlyPhotoPaths(supabase, child.id, start, end),
        ]);

        const preferences = await fetchPreferencesForFamily(supabase, familyId);

        // Gemini で生成
        const generatedContent = await generateAnnualReport(
          fiscalYear,
          { monthlyReports, weeklyReports, milestones, growthSummary },
          { childName: child.name, childBirthDate: child.birth_date },
          preferences,
        );

        // AnnualReportContent を構築
        const fiscalStart = new Date(fiscalYear, 3, 1);
        const fiscalEnd = new Date(fiscalYear + 1, 2, 31);
        const childAge = child.birth_date
          ? `${calcAge(child.birth_date, fiscalStart)} 〜 ${calcAge(child.birth_date, fiscalEnd)}`
          : "";

        const content: AnnualReportContent = {
          coverTitle: `${fiscalYear}年度 ${child.name ?? ""}の記録`,
          childAge,
          monthHighlights: generatedContent.monthHighlights.map((h) => ({
            month: h.month,
            text: h.text,
            photoPath: monthlyPhotos.get(h.month) ?? null,
          })),
          milestones: milestones.map((m) => ({
            title: m.title,
            date: m.milestone_date,
          })),
          growthSummary,
          closingMessage: generatedContent.closingMessage,
        };

        const { data: report } = await supabase
          .from("annual_reports")
          .upsert(
            {
              family_id: familyId,
              child_id: child.id,
              fiscal_year: fiscalYear,
              content,
              generated_at: new Date().toISOString(),
            },
            { onConflict: "family_id,child_id,fiscal_year" },
          )
          .select()
          .single();

        if (report) {
          await insertNotification(
            supabase,
            familyId,
            "auto_annual",
            `${fiscalYear}年度の年次アルバムが作成されました`,
            `/logs?tab=annual`,
          );
          generated++;
        }
      } catch (error) {
        console.error(
          `Annual auto-generate failed: family=${familyId} child=${child.id}`,
          error,
        );
      }
    }
  }

  return { generated, skipped };
}

// ------------------------------------------------------------------
// 古い既読通知のクリーンアップ
// ------------------------------------------------------------------
export async function cleanupOldNotifications(
  supabase: SBClient,
): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await supabase
    .from("notifications")
    .delete()
    .eq("read", true)
    .lt("created_at", thirtyDaysAgo.toISOString());
}

// ------------------------------------------------------------------
// JST 日付判定ヘルパー
// ------------------------------------------------------------------
export function toJST(date: Date): Date {
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(date.getTime() + jstOffset);
}

export function isLastDayOfMonth(date: Date): boolean {
  const last = lastDayOfMonth(date);
  return date.getDate() === last.getDate();
}

export function isMarch31(date: Date): boolean {
  return date.getMonth() === 2 && date.getDate() === 31;
}
