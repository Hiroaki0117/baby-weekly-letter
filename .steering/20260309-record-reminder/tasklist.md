# v3.6 記録リマインダー - タスクリスト

## フェーズ1: PWA基盤

- [ ] 1-1. `public/manifest.webmanifest` 新規作成
- [ ] 1-2. `public/icon-192.png`, `public/icon-512.png` アイコン作成
- [ ] 1-3. `src/app/layout.tsx` に manifest リンク追加
- [ ] 1-4. `public/sw.js` 新規作成（Push受信・通知クリック処理）
- [ ] 1-5. `src/lib/service-worker.ts` 新規作成（SW登録ユーティリティ）
- [ ] 1-6. `src/app/layout.tsx` にSW登録処理を配置

## フェーズ2: データ層

- [ ] 2-1. マイグレーション作成（`push_subscriptions` + `notification_settings` テーブル + RLS）
- [ ] 2-2. `src/types/database.ts` に型を手動追加
- [ ] 2-3. `src/types/index.ts` にエクスポート追加
- [ ] 2-4. `src/lib/push-subscription.ts` 新規作成（Subscription CRUD + 通知設定 CRUD）

## フェーズ3: 通知許可UI

- [ ] 3-1. `src/components/notification/notification-prompt.tsx` 新規作成（許可ダイアログ）
- [ ] 3-2. `src/app/(main)/layout.tsx` に NotificationPrompt 配置
- [ ] 3-3. `src/app/(main)/settings/page.tsx` に通知ON/OFFトグル追加

## フェーズ4: バックエンド（通知送信）

- [ ] 4-1. `web-push` パッケージ追加
- [ ] 4-2. `src/app/api/cron/send-reminders/route.ts` 新規作成（通知送信Route Handler）
- [ ] 4-3. `.github/workflows/send-reminders.yml` 新規作成（GitHub Actions cron）
- [ ] 4-4. VAPID鍵生成・環境変数設定手順をドキュメント化

## フェーズ5: 品質チェック・仕上げ

- [ ] 5-1. lint / type-check / test 通過確認
- [ ] 5-2. 永続的ドキュメント更新（`docs/functional-design.md`, `docs/product-requirements.md`）
- [ ] 5-3. コミット・プッシュ
