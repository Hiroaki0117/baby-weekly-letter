import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyId } from "@/lib/supabase/family";
import { generateWeeklyReport } from "@/lib/weekly-report/generate";
import { fetchReportPreferences } from "@/lib/report-preferences";
import { extractMilestones } from "@/lib/milestones/extract";
import { saveMilestones } from "@/lib/milestones";
import { generateReportSchema } from "@/schemas/weekly-report";
import type { DailyLog, Child } from "@/types";

/**
 * 前回通信の結びの文（最後の段落）を抽出する
 */
function extractEnding(content: string): string {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  // 最後の非空行を返す
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
    const parsed = generateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 }
      );
    }

    const { weekStart, weekEnd, childId } = parsed.data;

    // 子ども情報取得
    const { data: childData } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .single();

    const child = childData as Child | null;

    // 前回の通信を取得（同じ子供の直近1件）
    const { data: prevReportData } = await supabase
      .from("weekly_reports")
      .select("content")
      .eq("child_id", childId)
      .lt("week_start", weekStart)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    const previousReportEnding = prevReportData
      ? extractEnding((prevReportData as { content: string }).content)
      : null;

    // 対象期間・対象子供のログを取得
    const { data: logs, error: logsError } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("log_date", weekStart)
      .lte("log_date", weekEnd)
      .order("log_date", { ascending: true });

    if (logsError) {
      return NextResponse.json(
        { error: "ログの取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: "対象期間のログがありません" },
        { status: 400 }
      );
    }

    // ユーザーの通信設定を取得
    const preferences = await fetchReportPreferences();

    // 週次通信を生成
    const typedLogs = logs as DailyLog[];
    const content = await generateWeeklyReport(typedLogs, weekStart, weekEnd, {
      childName: child?.name,
      childBirthDate: child?.birth_date,
      previousReportEnding,
    }, preferences);

    // upsert
    const sourceLogIds = typedLogs.map((l) => l.id);
    const { data: report, error: upsertError } = await supabase
      .from("weekly_reports")
      .upsert(
        {
          family_id: familyId,
          child_id: childId,
          week_start: weekStart,
          week_end: weekEnd,
          content,
          generated_at: new Date().toISOString(),
          source_log_ids: sourceLogIds,
        },
        { onConflict: "family_id,child_id,week_start" }
      )
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json(
        { error: "通信の保存に失敗しました" },
        { status: 500 }
      );
    }

    // マイルストーン自動抽出（エラーが起きても通信生成自体は成功させる）
    let extractedMilestones: { title: string; category: string }[] = [];
    try {
      const milestones = await extractMilestones(typedLogs);
      if (milestones.length > 0 && report) {
        const { saved } = await saveMilestones(
          supabase,
          childId,
          milestones,
          (report as { id: string }).id
        );
        if (saved > 0) {
          extractedMilestones = milestones
            .slice(0, saved)
            .map((m) => ({ title: m.title, category: m.category }));
        }
      }
    } catch (milestoneError) {
      console.error("Milestone extraction/save error:", milestoneError);
    }

    return NextResponse.json({ ...report, extractedMilestones });
  } catch (error) {
    console.error("Weekly report generation error:", error);
    return NextResponse.json(
      { error: "生成に失敗しました。再度お試しください" },
      { status: 500 }
    );
  }
}
