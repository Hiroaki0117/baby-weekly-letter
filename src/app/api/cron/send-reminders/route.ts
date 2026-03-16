import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com";

export async function POST(request: Request) {
  // 認証チェック
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 当日（JST）の日付を取得
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  const today = jstDate.toISOString().split("T")[0];

  // 当日記録済みの family_id 一覧を取得
  const { data: logsToday } = await supabase
    .from("daily_logs")
    .select("family_id")
    .eq("log_date", today);

  const recordedFamilyIds = new Set(
    (logsToday ?? []).map((log: { family_id: string }) => log.family_id)
  );

  // リマインダー有効なユーザーの Push Subscription を2段階で取得
  const { data: enabledUsers } = await supabase
    .from("notification_settings")
    .select("user_id")
    .eq("reminder_enabled", true);

  const enabledUserIds = (enabledUsers ?? []).map((u: { user_id: string }) => u.user_id);

  if (enabledUserIds.length === 0) {
    return NextResponse.json({ sent: 0, message: "No enabled users" });
  }

  const { data: allSubscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, family_id, endpoint, p256dh, auth")
    .in("user_id", enabledUserIds);

  // 未記録の家族に属するSubscriptionのみフィルタ
  const targetSubscriptions = (allSubscriptions ?? []).filter(
    (sub: { family_id: string }) => !recordedFamilyIds.has(sub.family_id)
  );

  const payload = JSON.stringify({
    title: "すくすく日記",
    body: "今日の日記がまだありません。今日の出来事を残しましょう！",
    url: "/",
  });

  let sent = 0;
  const staleIds: string[] = [];

  for (const sub of targetSubscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent++;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        staleIds.push(sub.id);
      }
    }
  }

  // 無効なSubscriptionを削除
  if (staleIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", staleIds);
  }

  return NextResponse.json({
    sent,
    staleRemoved: staleIds.length,
    total: targetSubscriptions.length,
  });
}
