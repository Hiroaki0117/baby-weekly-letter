import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyId } from "@/lib/supabase/family";
import { generateMonthlyReport } from "@/lib/monthly-report/generate";
import { generateMonthlyReportSchema } from "@/schemas/monthly-report";
import { getMonthRange, toDateString } from "@/lib/date";
import type { WeeklyReport, Child } from "@/types";

/**
 * 前回まとめの結びの文（最後の段落）を抽出する
 */
function extractEnding(content: string): string {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines[lines.length - 1] ?? "";
}

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
        { status: 400 }
      );
    }

    // リクエストバリデーション
    const body = await request.json();
    const parsed = generateMonthlyReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 }
      );
    }

    const { month: monthStr } = parsed.data;
    const [yearNum, monthNum] = monthStr.split("-").map(Number);
    const { start: monthStart, end: monthEnd } = getMonthRange(
      yearNum,
      monthNum - 1
    );
    const monthDate = toDateString(monthStart); // "YYYY-MM-01"

    // 子ども情報取得（children テーブルから最初の1件）
    const { data: childData } = await supabase
      .from("children")
      .select("*")
      .limit(1)
      .single();

    const child = childData as Child | null;

    // 該当月の週次通信を取得（week_start が月内に含まれるもの）
    // RLS で family_id が自動フィルタされる
    const { data: weeklyReports, error: weeklyError } = await supabase
      .from("weekly_reports")
      .select("*")
      .gte("week_start", toDateString(monthStart))
      .lte("week_start", toDateString(monthEnd))
      .order("week_start", { ascending: true });

    if (weeklyError) {
      return NextResponse.json(
        { error: "週次通信の取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!weeklyReports || weeklyReports.length === 0) {
      return NextResponse.json(
        { error: "該当月の週次通信がありません" },
        { status: 400 }
      );
    }

    const typedReports = weeklyReports as WeeklyReport[];

    // 前月の月次まとめを取得（文脈連続性）
    // RLS で family_id が自動フィルタされる
    const { data: prevMonthlyData } = await supabase
      .from("monthly_reports")
      .select("content")
      .lt("month", monthDate)
      .order("month", { ascending: false })
      .limit(1)
      .single();

    const previousMonthlyEnding = prevMonthlyData
      ? extractEnding((prevMonthlyData as { content: string }).content)
      : null;

    // 月次まとめを生成
    const content = await generateMonthlyReport(
      typedReports,
      yearNum,
      monthNum - 1,
      {
        childName: child?.name,
        childBirthDate: child?.birth_date,
        previousMonthlyEnding,
      }
    );

    // upsert
    const sourceWeeklyReportIds = typedReports.map((r) => r.id);
    const { data: report, error: upsertError } = await supabase
      .from("monthly_reports")
      .upsert(
        {
          family_id: familyId,
          month: monthDate,
          content,
          generated_at: new Date().toISOString(),
          source_weekly_report_ids: sourceWeeklyReportIds,
        },
        { onConflict: "family_id,month" }
      )
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json(
        { error: "まとめの保存に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Monthly report generation error:", error);
    return NextResponse.json(
      { error: "生成に失敗しました。再度お試しください" },
      { status: 500 }
    );
  }
}
