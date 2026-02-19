import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyReport } from "@/lib/weekly-report/generate";
import { generateReportSchema } from "@/schemas/weekly-report";
import type { DailyLog } from "@/types";

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
    const content = await generateWeeklyReport(typedLogs, weekStart, weekEnd);

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
