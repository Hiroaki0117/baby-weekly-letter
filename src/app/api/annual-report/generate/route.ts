import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyId } from "@/lib/supabase/family";
import { generateAnnualReport } from "@/lib/annual-report/generate";
import {
  getFiscalYearRange,
  canGenerate,
  isInCooldown,
  getCooldownRemaining,
  getMonthlyPhotoPaths,
  getGrowthSummary,
} from "@/lib/annual-report/data";
import { fetchReportPreferences } from "@/lib/report-preferences";
import { generateAnnualReportSchema } from "@/schemas/annual-report";
import { calcAge } from "@/lib/date";
import type {
  Child,
  WeeklyReport,
  MonthlyReport,
  Milestone,
  AnnualReportContent,
  AnnualReport,
} from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // family_id 取得
    const familyId = await getMyFamilyId(supabase);
    if (!familyId) {
      return NextResponse.json(
        { error: "家族が設定されていません" },
        { status: 400 },
      );
    }

    // リクエストバリデーション
    const body = await request.json();
    const parsed = generateAnnualReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 },
      );
    }

    const { fiscalYear, childId } = parsed.data;

    // 生成時期チェック
    if (!canGenerate(fiscalYear)) {
      return NextResponse.json(
        {
          error: `${fiscalYear}年度のアルバムは${fiscalYear + 1}年3月以降に生成できます`,
        },
        { status: 400 },
      );
    }

    // クールダウンチェック
    const { data: existingReport } = await supabase
      .from("annual_reports")
      .select("generated_at")
      .eq("family_id", familyId)
      .eq("child_id", childId)
      .eq("fiscal_year", fiscalYear)
      .maybeSingle();

    if (existingReport && isInCooldown(existingReport.generated_at)) {
      const remainingMs = getCooldownRemaining(existingReport.generated_at);
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return NextResponse.json(
        { error: `再生成は${remainingHours}時間後に可能です` },
        { status: 429 },
      );
    }

    // 子ども情報取得
    const { data: childData } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .single();

    const child = childData as Child | null;

    const { start, end } = getFiscalYearRange(fiscalYear);

    // 月次まとめ取得
    const { data: monthlyData } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("child_id", childId)
      .gte("month", start)
      .lte("month", end)
      .order("month", { ascending: true });

    const monthlyReports = (monthlyData ?? []) as MonthlyReport[];

    // 週次通信取得（月次まとめがない月のフォールバック用）
    const { data: weeklyData } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("child_id", childId)
      .gte("week_start", start)
      .lte("week_start", end)
      .order("week_start", { ascending: true });

    const weeklyReports = (weeklyData ?? []) as WeeklyReport[];

    // データ存在チェック
    if (monthlyReports.length === 0 && weeklyReports.length === 0) {
      return NextResponse.json(
        { error: "対象年度の記録がありません" },
        { status: 400 },
      );
    }

    // マイルストーン取得
    const { data: milestoneData } = await supabase
      .from("milestones")
      .select("*")
      .eq("child_id", childId)
      .gte("milestone_date", start)
      .lte("milestone_date", end)
      .order("milestone_date", { ascending: true });

    const milestones = (milestoneData ?? []) as Milestone[];

    // 成長データ・写真パス取得
    const [growthSummary, monthlyPhotos] = await Promise.all([
      getGrowthSummary(supabase, childId, start, end),
      getMonthlyPhotoPaths(supabase, childId, start, end),
    ]);

    // 通信設定取得
    const preferences = await fetchReportPreferences();

    // Gemini で生成
    const generated = await generateAnnualReport(
      fiscalYear,
      { monthlyReports, weeklyReports, milestones, growthSummary },
      { childName: child?.name, childBirthDate: child?.birth_date },
      preferences,
    );

    // AnnualReportContent を構築
    const fiscalStart = new Date(fiscalYear, 3, 1);
    const childAge = child?.birth_date
      ? calcAge(child.birth_date, fiscalStart)
      : "";

    const content: AnnualReportContent = {
      coverTitle: `${fiscalYear}年度 ${child?.name ?? ""}の記録`,
      childAge,
      monthHighlights: generated.monthHighlights.map((h) => ({
        month: h.month,
        text: h.text,
        photoPath: monthlyPhotos.get(h.month) ?? null,
      })),
      milestones: milestones.map((m) => ({
        title: m.title,
        date: m.milestone_date,
      })),
      growthSummary,
      closingMessage: generated.closingMessage,
    };

    // upsert
    const { data: report, error: upsertError } = await supabase
      .from("annual_reports")
      .upsert(
        {
          family_id: familyId,
          child_id: childId,
          fiscal_year: fiscalYear,
          content,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "family_id,child_id,fiscal_year" },
      )
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json(
        { error: "アルバムの保存に失敗しました" },
        { status: 500 },
      );
    }

    return NextResponse.json(report as AnnualReport);
  } catch (error) {
    console.error("Annual report generation error:", error);
    return NextResponse.json(
      { error: "生成に失敗しました。再度お試しください" },
      { status: 500 },
    );
  }
}
