import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyReport } from "@/lib/weekly-report/generate";
import { generateReportSchema } from "@/schemas/weekly-report";
import type { DailyLog, Profile } from "@/types";

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

    // リクエストバリデーション
    const body = await request.json();
    const parsed = generateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 }
      );
    }

    const { weekStart, weekEnd } = parsed.data;

    // プロフィール取得
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const profile = profileData as Profile | null;

    // 前回の通信を取得（今回の weekStart より前の直近1件）
    const { data: prevReportData } = await supabase
      .from("weekly_reports")
      .select("content")
      .eq("user_id", user.id)
      .lt("week_start", weekStart)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    const previousReportEnding = prevReportData
      ? extractEnding((prevReportData as { content: string }).content)
      : null;

    // 対象期間のログを取得
    const { data: logs, error: logsError } = await supabase
      .from("daily_logs")
      .select("*")
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

    // 週次通信を生成
    const typedLogs = logs as DailyLog[];
    const content = await generateWeeklyReport(typedLogs, weekStart, weekEnd, {
      childName: profile?.child_name,
      childBirthDate: profile?.child_birth_date,
      previousReportEnding,
    });

    // upsert
    const sourceLogIds = typedLogs.map((l) => l.id);
    const { data: report, error: upsertError } = await supabase
      .from("weekly_reports")
      .upsert(
        {
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          content,
          generated_at: new Date().toISOString(),
          source_log_ids: sourceLogIds,
        },
        { onConflict: "user_id,week_start" }
      )
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json(
        { error: "通信の保存に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Weekly report generation error:", error);
    return NextResponse.json(
      { error: "生成に失敗しました。再度お試しください" },
      { status: 500 }
    );
  }
}
