import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  getAutoGenerateFamilies,
  processWeekly,
  processMonthly,
  processAnnual,
  cleanupOldNotifications,
  toJST,
  isLastDayOfMonth,
  isMarch31,
} from "@/lib/cron/auto-generate";

export async function GET(request: Request) {
  // 認証チェック
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const jstNow = toJST(new Date());
  const isSunday = jstNow.getDay() === 0;
  const isMonthEnd = isLastDayOfMonth(jstNow);
  const isFiscalYearEnd = isMarch31(jstNow);

  const results: Record<string, unknown> = {
    date: jstNow.toISOString(),
    isSunday,
    isMonthEnd,
    isFiscalYearEnd,
  };

  try {
    const familyIds = await getAutoGenerateFamilies(supabase);
    results.targetFamilies = familyIds.length;

    if (familyIds.length === 0) {
      return NextResponse.json({ ...results, message: "No target families" });
    }

    // 順序保証: 週次 → 月次 → 年次
    if (isSunday) {
      results.weekly = await processWeekly(supabase, familyIds, jstNow);
    }

    if (isMonthEnd) {
      results.monthly = await processMonthly(supabase, familyIds, jstNow);
    }

    if (isFiscalYearEnd) {
      results.annual = await processAnnual(supabase, familyIds, jstNow);
    }

    // 古い既読通知のクリーンアップ
    await cleanupOldNotifications(supabase);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Auto-generate cron error:", error);
    return NextResponse.json(
      { error: "Internal server error", ...results },
      { status: 500 },
    );
  }
}
