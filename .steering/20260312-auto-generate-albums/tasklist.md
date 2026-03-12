# タスクリスト：アルバム自動生成 + 通知統合

## フェーズ1: DB マイグレーション

- [ ] 1-1. `notifications` テーブル作成マイグレーション
  - テーブル定義（type CHECK 制約: auto_weekly, auto_monthly, auto_annual, reaction, comment）
  - RLS ポリシー（SELECT/UPDATE: `family_id = my_family_id() AND (user_id IS NULL OR user_id = auth.uid())`）
  - インデックス（family_id+read, user_id+read の部分インデックス）
- [ ] 1-2. リアクション/コメント通知トリガー作成
  - `notify_on_reaction()` 関数 + トリガー（log_reactions INSERT 後）
  - `notify_on_comment()` 関数 + トリガー（log_comments INSERT 後）
  - 自分のログへの自分の操作は通知しない
- [ ] 1-3. `report_preferences` に `auto_generate` カラム追加マイグレーション
  - `ALTER TABLE report_preferences ADD COLUMN auto_generate boolean NOT NULL DEFAULT true`

## フェーズ2: 型・スキーマ更新

- [ ] 2-1. `src/types/database.ts` に notifications テーブル型を追加
- [ ] 2-2. `src/types/index.ts` に `Notification` 型エクスポートを追加
- [ ] 2-3. `src/schemas/report-preferences.ts` に `autoGenerate` フィールドを追加
- [ ] 2-4. `__tests__/schemas/report-preferences.test.ts` にテスト追加

## フェーズ3: Service Role Client + cron 基盤

- [ ] 3-1. `src/lib/supabase/service.ts` — Service Role Client 作成関数
- [ ] 3-2. `src/lib/cron/auto-generate.ts` — 自動生成ロジック
  - `getAutoGenerateFamilies()` — 自動生成有効な家族の取得
  - `processWeekly()` — 週次アルバム自動生成（ログ3件以上チェック）
  - `processMonthly()` — 月次アルバム自動生成（週次アルバム1件以上チェック）
  - `processAnnual()` — 年次アルバム自動生成（月次アルバム1件以上チェック）
  - `insertNotification()` — 通知レコード挿入
  - `cleanupOldNotifications()` — 30日以上前の既読通知を削除
  - `fetchPreferencesForFamily()` — 家族単位の preferences 取得
- [ ] 3-3. `src/app/api/cron/auto-generate/route.ts` — cron エンドポイント
  - CRON_SECRET 認証
  - JST 日付判定（日曜/月末/3月31日）
  - 順序保証（週次→月次→年次）

## フェーズ4: 通知 UI 統合

- [ ] 4-1. `src/components/home/notification-list.tsx` — 統合通知コンポーネント
  - 未読通知をリスト表示（最大10件）
  - type ごとのアイコン（✉📖📚❤️💬）
  - タップで遷移 + 既読更新
- [ ] 4-2. `src/app/(main)/page.tsx` — ホーム画面の通知統合
  - `ReactionNotice` を `NotificationList` に置き換え
  - localStorage の新着カウントロジック削除
  - notifications テーブルから未読通知を取得
- [ ] 4-3. `src/app/(main)/logs/page.tsx` — localStorage 更新処理の削除
  - `lastReactionCheckedAt` / `lastCommentCheckedAt` の `localStorage.setItem` を削除
- [ ] 4-4. `src/components/home/reaction-notice.tsx` を削除

## フェーズ5: アルバム設定 UI

- [ ] 5-1. `src/components/settings/report-preferences-form.tsx` — 自動生成トグル追加
  - トグル UI（デフォルト ON）
  - フォーム送信時に `auto_generate` を含めて upsert

## フェーズ6: Vercel 設定

- [ ] 6-1. `vercel.json` 作成 — cron スケジュール設定
  - `auto-generate` のみ定義（既存の send-reminders は GitHub Actions で実行）

## フェーズ7: 品質チェック + デプロイ

- [ ] 7-1. `pnpm lint` / `pnpm type-check` / `pnpm test`
- [ ] 7-2. Supabase にマイグレーション適用の確認
- [ ] 7-3. Vercel に `CRON_SECRET` 環境変数が設定済みか確認
- [ ] 7-4. commit + push
