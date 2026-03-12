# 設計書：アルバム自動生成 + 通知統合

## 1. アーキテクチャ概要

```
Vercel Cron (毎日 10:00 UTC = 19:00 JST)
  │
  ▼
GET /api/cron/auto-generate
  │  Authorization: Bearer <CRON_SECRET>
  │
  ├─ 今日が日曜？    → 週次アルバム自動生成
  ├─ 今日が月末日？  → 月次アルバム自動生成
  └─ 今日が3/31？    → 年次アルバム自動生成
  │
  ▼
各生成完了後 → notifications テーブルに通知挿入
  │
  ▼
ホーム画面で未読通知を表示 → タップで遷移
```

```
リアクション / コメント
  │
  ▼
DB トリガー → notifications テーブルに通知挿入
  │
  ▼
ホーム画面で未読通知を表示 → タップでログ一覧に遷移
```

## 2. DB 変更

### 2.1 `report_preferences` テーブルにカラム追加

```sql
ALTER TABLE report_preferences
  ADD COLUMN auto_generate boolean NOT NULL DEFAULT true;
```

既存レコードはデフォルト `true`（自動生成有効）。

### 2.2 `notifications` テーブル新設

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  link text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notifications_type_check CHECK (
    type IN ('auto_weekly', 'auto_monthly', 'auto_annual', 'reaction', 'comment')
  )
);

CREATE INDEX idx_notifications_family_unread
  ON notifications(family_id, read) WHERE read = false;

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, read) WHERE read = false;
```

**カラム設計:**
| カラム | 用途 |
|--------|------|
| `family_id` | 所属家族（全通知で必須） |
| `user_id` | 通知の宛先ユーザー。リアクション/コメント通知はログ作成者宛。アルバム通知は NULL（家族全員宛） |
| `type` | 通知種別 |
| `title` | 表示テキスト |
| `link` | タップ時の遷移先パス |
| `read` | 既読フラグ |

**通知タイプ:**
| type | user_id | title 例 | link 例 |
|------|---------|---------|---------|
| `auto_weekly` | NULL | `3/9〜3/15の週次アルバムが作成されました` | `/weekly/{id}` |
| `auto_monthly` | NULL | `2026年3月の月次アルバムが作成されました` | `/weekly/monthly/{id}` |
| `auto_annual` | NULL | `2025年度の年次アルバムが作成されました` | `/logs?tab=annual` |
| `reaction` | ログ作成者 | `あなたのログにリアクションがありました` | `/logs` |
| `comment` | ログ作成者 | `あなたのログにコメントがありました` | `/logs` |

**RLS ポリシー:**
- SELECT: `family_id = my_family_id() AND (user_id IS NULL OR user_id = auth.uid())`
- UPDATE (read フラグ): 同上
- INSERT: なし（cron は service role、トリガーは SECURITY DEFINER で挿入）

### 2.3 リアクション・コメント通知用 DB トリガー

`localStorage` ベースの既読管理を廃止し、DB トリガーで通知を挿入する。

```sql
-- リアクション追加時の通知トリガー
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  log_author_id uuid;
  log_family_id uuid;
BEGIN
  -- ログの作成者と family_id を取得
  SELECT author_id, family_id INTO log_author_id, log_family_id
  FROM daily_logs WHERE id = NEW.log_id;

  -- 自分自身のログへのリアクションは通知しない
  IF NEW.user_id = log_author_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (family_id, user_id, type, title, link)
  VALUES (
    log_family_id,
    log_author_id,
    'reaction',
    'あなたのログにリアクションがありました',
    '/logs'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_reaction
  AFTER INSERT ON log_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_reaction();
```

```sql
-- コメント追加時の通知トリガー
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  log_author_id uuid;
  log_family_id uuid;
BEGIN
  SELECT author_id, family_id INTO log_author_id, log_family_id
  FROM daily_logs WHERE id = NEW.log_id;

  IF NEW.user_id = log_author_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (family_id, user_id, type, title, link)
  VALUES (
    log_family_id,
    log_author_id,
    'comment',
    'あなたのログにコメントがありました',
    '/logs'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON log_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();
```

## 3. Cron エンドポイント設計

### 3.1 Vercel 設定

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/auto-generate",
      "schedule": "0 10 * * *"
    }
  ]
}
```

- `0 10 * * *` = 毎日 10:00 UTC = 19:00 JST
- Vercel Cron は UTC 基準
- 既存の send-reminders cron は GitHub Actions で実行されているため、Vercel Cron 枠は本機能で 1 枠目

### 3.2 認証

Vercel Cron は自動的に `Authorization: Bearer <CRON_SECRET>` ヘッダーを付与する。
エンドポイントで `CRON_SECRET` 環境変数と照合して検証する。

```typescript
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}
```

### 3.3 処理フロー

```typescript
// /api/cron/auto-generate/route.ts
export async function GET(request: Request) {
  // 1. 認証チェック
  if (!verifyCronAuth(request)) return 401;

  // 2. Service Role Client を作成（RLS バイパス）
  const supabase = createServiceRoleClient();

  // 3. 今日の曜日・日付を判定（JST）
  const jstNow = toJST(new Date());
  const isSunday = jstNow.getDay() === 0;
  const isLastDayOfMonth = isLastDay(jstNow);
  const isMarch31 = jstNow.getMonth() === 2 && jstNow.getDate() === 31;

  // 4. 自動生成が有効な家族を取得
  const families = await getAutoGenerateFamilies(supabase);

  // 5. 順序保証: 週次 → 月次 → 年次
  if (isSunday) await processWeekly(supabase, families, jstNow);
  if (isLastDayOfMonth) await processMonthly(supabase, families, jstNow);
  if (isMarch31) await processAnnual(supabase, families, jstNow);

  return 200;
}
```

### 3.4 自動生成が有効な家族の取得

**判定ルール:**
- `report_preferences` にレコードがない → デフォルトで有効
- `auto_generate = true` のレコードがある → 有効
- 家族の全メンバーが `auto_generate = false` → 無効

```sql
SELECT DISTINCT f.id AS family_id
FROM families f
JOIN family_members fm ON fm.family_id = f.id
LEFT JOIN report_preferences rp ON rp.user_id = fm.user_id
WHERE rp.auto_generate IS NULL   -- レコードなし = デフォルト true
   OR rp.auto_generate = true;   -- 明示的に有効
```

### 3.5 週次アルバム自動生成

```typescript
async function processWeekly(supabase, families, jstNow) {
  const weekStart = startOfWeek(jstNow, { weekStartsOn: 1 }); // 月曜
  const weekEnd = endOfWeek(jstNow, { weekStartsOn: 1 });      // 日曜

  for (const family of families) {
    const children = await getChildren(supabase, family.id);

    for (const child of children) {
      // 既に生成済みならスキップ
      if (await hasWeeklyReport(supabase, family.id, child.id, weekStart)) continue;

      // 当該週のログが3件以上あるか
      const logCount = await countLogs(supabase, child.id, weekStart, weekEnd);
      if (logCount < 3) continue;

      // 既存の生成ロジックを再利用
      const logs = await fetchLogs(supabase, child.id, weekStart, weekEnd);
      const preferences = await fetchPreferencesForFamily(supabase, family.id);
      const previousEnding = await fetchPreviousWeeklyEnding(supabase, family.id, child.id);

      const content = await generateWeeklyReport(logs, weekStartStr, weekEndStr, {
        childName: child.name,
        childBirthDate: child.birth_date,
        previousReportEnding: previousEnding,
      }, preferences);

      // upsert
      const { data: report } = await supabase.from("weekly_reports").upsert({
        family_id: family.id,
        child_id: child.id,
        week_start: weekStartStr,
        week_end: weekEndStr,
        content,
        generated_at: new Date().toISOString(),
      }, { onConflict: "family_id,child_id,week_start" })
      .select().single();

      // 通知挿入（家族全員宛: user_id = NULL）
      await insertNotification(supabase, family.id, null, "auto_weekly", report);
    }
  }
}
```

### 3.6 月次アルバム自動生成

```typescript
async function processMonthly(supabase, families, jstNow) {
  const year = jstNow.getFullYear();
  const month = jstNow.getMonth(); // 0-11
  const monthStr = format(jstNow, "yyyy-MM");

  for (const family of families) {
    const children = await getChildren(supabase, family.id);

    for (const child of children) {
      // 既に生成済みならスキップ
      if (await hasMonthlyReport(supabase, family.id, child.id, monthStr)) continue;

      // 当月の週次アルバムが1件以上あるか
      const weeklyReports = await fetchMonthWeeklyReports(supabase, family.id, child.id, year, month);
      if (weeklyReports.length === 0) continue;

      // 既存の生成ロジックを再利用
      const preferences = await fetchPreferencesForFamily(supabase, family.id);
      const previousEnding = await fetchPreviousMonthlyEnding(supabase, family.id, child.id);

      const content = await generateMonthlyReport(weeklyReports, year, month, {
        childName: child.name,
        childBirthDate: child.birth_date,
        previousMonthlyEnding: previousEnding,
      }, preferences);

      const { data: report } = await supabase.from("monthly_reports").upsert({
        family_id: family.id,
        child_id: child.id,
        month: monthStr + "-01",
        content,
        generated_at: new Date().toISOString(),
        source_weekly_report_ids: weeklyReports.map(r => r.id),
      }, { onConflict: "family_id,child_id,month" })
      .select().single();

      await insertNotification(supabase, family.id, null, "auto_monthly", report);
    }
  }
}
```

### 3.7 年次アルバム自動生成

```typescript
async function processAnnual(supabase, families, jstNow) {
  const fiscalYear = jstNow.getFullYear() - 1; // 3月31日 → 前年度

  for (const family of families) {
    const children = await getChildren(supabase, family.id);

    for (const child of children) {
      // 既に生成済みならスキップ
      if (await hasAnnualReport(supabase, family.id, child.id, fiscalYear)) continue;

      // 年度内の月次アルバムが1件以上あるか
      // 既存の route.ts のデータ取得ロジックを再利用
      // generateAnnualReport() を呼び出し
      // upsert → 通知挿入
    }
  }
}
```

## 4. Service Role Client

cron エンドポイントはユーザーセッションがないため、RLS をバイパスする **Service Role Client** を使用する。

```typescript
// src/lib/supabase/service.ts
import { createClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

`SUPABASE_SERVICE_ROLE_KEY` は既に Vercel 環境変数として設定済み。

## 5. 通知表示の統合（ホーム画面）

### 5.1 現状からの変更

**廃止するもの:**
- `ReactionNotice` コンポーネント
- `localStorage` の `lastReactionCheckedAt` / `lastCommentCheckedAt`
- ホーム画面での `log_reactions` / `log_comments` の新着カウントクエリ
- `logs/page.tsx` での localStorage 更新処理

**新設するもの:**
- `NotificationList` コンポーネント（全通知種別を統合表示）
- `notifications` テーブルからの未読通知取得

### 5.2 通知取得

```typescript
// ホーム画面のデータ取得
const { data: notifications } = await supabase
  .from("notifications")
  .select("*")
  .eq("read", false)
  .order("created_at", { ascending: false })
  .limit(10);
```

RLS で `family_id = my_family_id() AND (user_id IS NULL OR user_id = auth.uid())` を適用するため、自分宛て + 家族全員宛ての通知のみ取得される。

### 5.3 NotificationList コンポーネント

```
┌──────────────────────────────────────────┐
│ ✉ 3/9〜3/15の週次アルバムが作成されました  →│
├──────────────────────────────────────────┤
│ ❤️ あなたのログにリアクションがありました    →│
├──────────────────────────────────────────┤
│ 💬 あなたのログにコメントがありました       →│
└──────────────────────────────────────────┘
```

- 各通知をタップで `link` に遷移 + `read = true` に更新
- アイコンは `type` で決定: `auto_weekly`→✉, `auto_monthly`→📖, `auto_annual`→📚, `reaction`→❤️, `comment`→💬
- 最大10件表示

### 5.4 表示位置

ホーム画面の `ReactionNotice` があった場所をそのまま `NotificationList` に置き換え。

```
┌─────────────────────────────────────────┐
│ 日付ヘッダー                            │
├─────────────────────────────────────────┤
│ NotificationList（統合通知）  ← ここ    │
├─────────────────────────────────────────┤
│ ○年前の今日                             │
│ クイック入力                             │
│ ...                                      │
└─────────────────────────────────────────┘
```

### 5.5 既読処理

通知タップ時に個別の通知を既読にする:

```typescript
async function markAsRead(notificationId: string) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}
```

## 6. アルバム設定の変更

### 6.1 UI 変更

`ReportPreferencesForm` に自動生成トグルを追加。

```
┌──────────────────────────────┐
│ アルバム設定                  │
├──────────────────────────────┤
│ 自動生成                     │
│ [ON] アルバムを自動で作成する │
│                              │
│ 文体トーン                   │
│ (既存の選択肢)               │
│                              │
│ セクション構成               │
│ (既存のチェックボックス)     │
├──────────────────────────────┤
│ [保存する]                   │
└──────────────────────────────┘
```

### 6.2 スキーマ変更

```typescript
// src/schemas/report-preferences.ts
export const reportPreferencesSchema = z.object({
  tone: z.enum(["warm", "humor", "neutral", "poetic"]),
  sections: z.array(z.enum(["highlight", "digest", "growth", "encouragement", "quote"])).min(1),
  autoGenerate: z.boolean(),  // 追加
});
```

## 7. 家族単位の auto_generate 判定

`report_preferences` はユーザー単位のテーブルだが、自動生成は家族単位で実行される。

**判定ルール:**
- 家族のメンバーのうち、`report_preferences` に `auto_generate = true` のレコードがあるメンバーが1人でもいれば自動生成する
- `report_preferences` にレコードがないメンバーはデフォルト `true` として扱う
- つまり、家族全員が明示的に `auto_generate = false` にしている場合のみスキップ

```sql
SELECT DISTINCT f.id AS family_id
FROM families f
JOIN family_members fm ON fm.family_id = f.id
LEFT JOIN report_preferences rp ON rp.user_id = fm.user_id
WHERE rp.auto_generate IS NULL   -- レコードなし = デフォルト true
   OR rp.auto_generate = true;   -- 明示的に有効
```

## 8. preferences の取得（cron 用）

cron ではユーザーセッションがないため、家族メンバーの中で設定を持つユーザーの preferences を使用する。

```typescript
async function fetchPreferencesForFamily(supabase, familyId: string) {
  // 家族メンバーの report_preferences を1件取得（最新の updated_at 優先）
  const { data } = await supabase
    .from("family_members")
    .select("user_id")
    .eq("family_id", familyId);

  if (!data || data.length === 0) return DEFAULT_PREFERENCES;

  const userIds = data.map(m => m.user_id);
  const { data: pref } = await supabase
    .from("report_preferences")
    .select("tone, sections")
    .in("user_id", userIds)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return pref ?? DEFAULT_PREFERENCES;
}
```

## 9. エラーハンドリング

- 個別の子供の生成に失敗しても、他の子供・家族の処理は継続する
- エラーは `console.error` でログ出力（Vercel のログで確認可能）
- 通知は生成成功時のみ挿入

## 10. 通知の肥大化防止

リアクション/コメント通知は頻度が高い可能性があるため、古い既読通知を定期的に削除する。

cron エンドポイントの末尾で実行:
```typescript
// 30日以上前の既読通知を削除
await supabase
  .from("notifications")
  .delete()
  .eq("read", true)
  .lt("created_at", thirtyDaysAgo);
```

## 11. 変更対象ファイル一覧

### 新規作成
| ファイル | 内容 |
|---------|------|
| `src/app/api/cron/auto-generate/route.ts` | cron エンドポイント |
| `src/lib/supabase/service.ts` | Service Role Client |
| `src/lib/cron/auto-generate.ts` | 自動生成ロジック（週次/月次/年次） |
| `src/components/home/notification-list.tsx` | 統合通知コンポーネント |
| `supabase/migrations/XXXXXX_create_notifications.sql` | notifications テーブル + トリガー |
| `supabase/migrations/XXXXXX_add_auto_generate.sql` | auto_generate カラム追加 |
| `vercel.json` | cron 設定 |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/page.tsx` | `ReactionNotice` → `NotificationList` に置き換え、localStorage 削除、notifications 取得 |
| `src/app/(main)/logs/page.tsx` | localStorage の `lastReactionCheckedAt`/`lastCommentCheckedAt` 更新処理を削除 |
| `src/components/settings/report-preferences-form.tsx` | 自動生成トグル追加 |
| `src/schemas/report-preferences.ts` | `autoGenerate` フィールド追加 |
| `src/types/index.ts` | `Notification` 型追加 |

### 削除
| ファイル | 理由 |
|---------|------|
| `src/components/home/reaction-notice.tsx` | `NotificationList` に統合 |
