# v3.6 記録リマインダー - 設計

## 概要

PWA Web Push通知で毎日21:00 JSTに未記録の家族へリマインダーを送信する。Service Worker・Push Subscription管理・Next.js Route Handler・GitHub Actions cronを組み合わせて実現する。

## アーキテクチャ

```
[GitHub Actions] ──21:00 JST (cron)──▶ [Next.js Route Handler: /api/cron/send-reminders]
                                            │
                                            ├─ daily_logs から当日記録済み family_id を取得
                                            ├─ push_subscriptions から未記録家族の購読を取得
                                            └─ Web Push API で通知送信
```

```
[ブラウザ]
  │
  ├─ Service Worker 登録（初回アクセス時）
  ├─ 通知許可ダイアログ表示（初回 or 既存ユーザー初回）
  ├─ Push Subscription → Supabase に保存
  └─ 通知タップ → 「今日」ページへ遷移
```

## データ設計

### 新規テーブル: `push_subscriptions`

Push Subscriptionをユーザー単位で保存する。1ユーザーが複数デバイスで購読する可能性があるため、endpoint をユニークキーとする。

```sql
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の購読を管理" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());
```

### 新規テーブル: `notification_settings`

ユーザーごとの通知設定。ダイアログ表示済みフラグも管理する。

```sql
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reminder_enabled boolean NOT NULL DEFAULT false,
  prompt_shown boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の設定を管理" ON notification_settings
  FOR ALL USING (user_id = auth.uid());
```

## 実装コンポーネント

### フェーズ1: PWA基盤

#### 1-1. Web App Manifest

`public/manifest.webmanifest` を新規作成。PWAとして認識されるための最低限の設定。

```json
{
  "name": "すくすく日記",
  "short_name": "すくすく日記",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

`src/app/layout.tsx` の `<head>` に manifest リンクを追加。

#### 1-2. Service Worker

`public/sw.js` を新規作成。Push通知の受信とクリックハンドリングを担当。

```javascript
// Push受信
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "すくすく日記", {
      body: data.body ?? "今日の記録がまだありません",
      icon: "/icon-192.png",
      data: { url: data.url ?? "/" },
    })
  );
});

// 通知クリック
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

#### 1-3. Service Worker 登録

`src/lib/service-worker.ts` を新規作成。アプリ起動時にService Workerを登録するユーティリティ。

### フェーズ2: Push Subscription管理

#### 2-1. マイグレーション

`push_subscriptions` と `notification_settings` テーブルを作成するマイグレーションファイル。

#### 2-2. 型定義

`src/types/database.ts` と `src/types/index.ts` に型を追加。

#### 2-3. Push Subscription CRUD

`src/lib/push-subscription.ts` を新規作成。

- `savePushSubscription(client, subscription)` — Subscription をDBに保存（upsert）
- `deletePushSubscription(client, endpoint)` — 購読解除
- `getNotificationSettings(client)` — 通知設定を取得
- `updateNotificationSettings(client, settings)` — 通知設定を更新

#### 2-4. VAPID鍵管理

VAPIDキーペアを生成し、環境変数に設定する。

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — クライアント側で使用
- `VAPID_PRIVATE_KEY` — サーバーサイド（Route Handler）で使用

### フェーズ3: 通知許可UI

#### 3-1. 通知許可ダイアログ

`src/components/notification/notification-prompt.tsx` を新規作成。

- アプリレイアウトに配置し、条件を満たしたときにモーダル表示
- 表示条件: `notification_settings.prompt_shown = false`（レコード未存在も含む）
- 「通知を受け取る」ボタン → ブラウザの通知許可リクエスト → Subscription保存 → `prompt_shown=true`, `reminder_enabled=true`
- 「今はしない」ボタン → `prompt_shown=true`, `reminder_enabled=false`
- ブラウザが通知非対応の場合はダイアログを表示しない

#### 3-2. 設定画面に通知ON/OFF追加

`src/app/(main)/settings/page.tsx` に通知設定トグルを追加。

- ON → Subscription未保存なら通知許可リクエスト → 保存
- OFF → `reminder_enabled=false`（Subscriptionは残す。再ONで即有効化するため）

### フェーズ4: バックエンド（通知送信）

#### 4-1. Route Handler: `/api/cron/send-reminders`

`src/app/api/cron/send-reminders/route.ts` を新規作成。

認証: リクエストヘッダーに `CRON_SECRET` を含め、一致しなければ401を返す。

処理フロー:
1. 当日（JST）の `daily_logs` から記録済みの `family_id` 一覧を取得
2. `push_subscriptions` JOIN `notification_settings` で、未記録家族かつ `reminder_enabled=true` の購読を取得
3. `web-push` ライブラリで各Subscriptionに通知送信
4. 送信失敗（410 Gone等）のSubscriptionは削除

#### 4-2. GitHub Actions ワークフロー

`.github/workflows/send-reminders.yml` を新規作成。

```yaml
name: Send Daily Reminders
on:
  schedule:
    - cron: '0 12 * * *'  # UTC 12:00 = JST 21:00
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminder endpoint
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/send-reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail --silent --show-error
```

必要なGitHub Secrets:
- `APP_URL` — デプロイ先URL（例: `https://sukusuku-diary.vercel.app`）
- `CRON_SECRET` — cron認証用のシークレット

### フェーズ5: 品質チェック・仕上げ

- lint / type-check / test 通過確認
- 永続的ドキュメント更新（`docs/functional-design.md`, `docs/product-requirements.md`）
- コミット・プッシュ

## 変更ファイル一覧

### 新規作成

| ファイル | 内容 |
|----------|------|
| `public/manifest.webmanifest` | PWAマニフェスト |
| `public/sw.js` | Service Worker（Push受信・クリック処理） |
| `public/icon-192.png` | PWAアイコン 192x192 |
| `public/icon-512.png` | PWAアイコン 512x512 |
| `src/lib/service-worker.ts` | SW登録ユーティリティ |
| `src/lib/push-subscription.ts` | Push Subscription CRUD |
| `src/components/notification/notification-prompt.tsx` | 通知許可ダイアログ |
| `supabase/migrations/XXXXXXXX_create_push_subscriptions.sql` | DBマイグレーション |
| `src/app/api/cron/send-reminders/route.ts` | 通知送信Route Handler |
| `.github/workflows/send-reminders.yml` | GitHub Actions cronワークフロー |

### 変更

| ファイル | 変更内容 |
|----------|----------|
| `src/app/layout.tsx` | manifest リンク追加、SW登録コンポーネント配置 |
| `src/app/(main)/layout.tsx` or 適切な位置 | NotificationPrompt 配置 |
| `src/app/(main)/settings/page.tsx` | 通知ON/OFFトグル追加 |
| `src/types/database.ts` | `push_subscriptions`, `notification_settings` 型追加 |
| `src/types/index.ts` | 型エクスポート追加 |
| `docs/functional-design.md` | テーブル定義・ER図更新 |
| `docs/product-requirements.md` | v3.6 を実装済みに更新 |

## 注意事項

- **web-pushライブラリ**: Node.js用の `web-push` パッケージを使用。VAPIDベースの認証で通知を送信
- **VAPID鍵**: 一度生成したら変更不可（既存Subscriptionが無効化される）。本番環境で慎重に設定する
- **iOS Safari**: 16.4以降でWeb Push対応。PWAとしてホーム画面に追加した場合のみ動作する制約あり
- **GitHub Actions cron精度**: 数分のずれが発生する場合がある（正確に21:00ではない可能性）
- **CRON_SECRET**: Route Handlerの不正呼び出しを防ぐため、認証ヘッダーで保護する
