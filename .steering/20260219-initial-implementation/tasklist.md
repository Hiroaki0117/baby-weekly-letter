# 初回実装 - タスクリスト

## フェーズ1: 環境セットアップ

- [ ] 1.1 Next.js プロジェクト初期化（TypeScript, Tailwind CSS, App Router, src/）
- [ ] 1.2 追加パッケージインストール（@supabase/supabase-js, @supabase/ssr, react-hook-form, @hookform/resolvers, zod, date-fns, @google/generative-ai）
- [ ] 1.3 shadcn/ui 初期化 + 必要コンポーネント追加（button, card, input, textarea, badge, toast, label）
- [ ] 1.4 ESLint / Prettier 設定
- [ ] 1.5 Vitest 設定
- [ ] 1.6 .env.local テンプレート作成（.env.example）
- [ ] 1.7 パスエイリアス（@/）確認・設定
- [ ] 1.8 グローバルCSS・フォント設定

## フェーズ2: Supabase セットアップ

- [ ] 2.1 Supabase プロジェクト作成（ダッシュボード）
- [ ] 2.2 daily_logs テーブル作成 + インデックス
- [ ] 2.3 weekly_reports テーブル作成 + インデックス + ユニーク制約
- [ ] 2.4 RLS ポリシー設定（daily_logs, weekly_reports）
- [ ] 2.5 updated_at 自動更新トリガー作成
- [ ] 2.6 Storage バケット `log-photos` 作成 + ポリシー設定
- [ ] 2.7 Auth 設定（メール+パスワード有効化、Google OAuth 設定）
- [ ] 2.8 Supabase CLI で型生成（src/types/database.ts）
- [ ] 2.9 マイグレーションファイル作成（supabase/migrations/）

## フェーズ3: 認証機能

- [ ] 3.1 Supabase Client 作成（lib/supabase/client.ts, server.ts）
- [ ] 3.2 Next.js ミドルウェア作成（src/middleware.ts）- セッションリフレッシュ・認証ガード
- [ ] 3.3 OAuth コールバック（app/auth/callback/route.ts）
- [ ] 3.4 認証用レイアウト（app/(auth)/layout.tsx）
- [ ] 3.5 ログイン画面（app/(auth)/login/page.tsx）
- [ ] 3.6 アカウント登録画面（app/(auth)/signup/page.tsx）
- [ ] 3.7 認証カスタムフック（hooks/use-auth.ts）
- [ ] 3.8 動作確認: サインアップ → ログイン → ログアウト → Google OAuth

## フェーズ4: 共通部品・レイアウト

- [ ] 4.1 汎用ユーティリティ（lib/utils.ts - cn関数）
- [ ] 4.2 日付ユーティリティ（lib/date.ts - getWeekRange, formatDate等）
- [ ] 4.3 型定義（types/index.ts - DailyLog, WeeklyReport等）
- [ ] 4.4 Zodスキーマ（schemas/log.ts, schemas/weekly-report.ts）
- [ ] 4.5 メインレイアウト（app/(main)/layout.tsx）
- [ ] 4.6 ヘッダーコンポーネント（components/layout/header.tsx）
- [ ] 4.7 ナビゲーションコンポーネント（components/layout/nav.tsx）
- [ ] 4.8 トースト通知セットアップ（hooks/use-toast.ts）

## フェーズ5: 日次ログ機能

- [ ] 5.1 MoodSelector コンポーネント（components/log/mood-selector.tsx）
- [ ] 5.2 CategoryPicker コンポーネント（components/log/category-picker.tsx）
- [ ] 5.3 PhotoUploader コンポーネント（components/log/photo-uploader.tsx）
- [ ] 5.4 LogForm コンポーネント（components/log/log-form.tsx）- 新規作成・編集兼用
- [ ] 5.5 LogCard コンポーネント（components/log/log-card.tsx）
- [ ] 5.6 ホーム画面（app/(main)/page.tsx）- ログ入力 + 当日のログ一覧
- [ ] 5.7 ログ一覧画面（app/(main)/logs/page.tsx）
- [ ] 5.8 写真アップロード処理（Storage連携）
- [ ] 5.9 ログ編集・削除処理
- [ ] 5.10 動作確認: ログ作成 → 一覧表示 → 編集 → 削除 → 写真付きログ

## フェーズ6: 週次通信機能

- [ ] 6.1 Gemini Client 作成（lib/gemini/client.ts）
- [ ] 6.2 プロンプトテンプレート（lib/weekly-report/prompt.ts）
- [ ] 6.3 週次通信生成ロジック（lib/weekly-report/generate.ts）
- [ ] 6.4 生成 API Route Handler（app/api/weekly-report/generate/route.ts）
- [ ] 6.5 WeeklyReportCard コンポーネント（components/weekly/weekly-report-card.tsx）
- [ ] 6.6 PhotoGallery コンポーネント（components/weekly/photo-gallery.tsx）
- [ ] 6.7 WeeklyReportDetail コンポーネント（components/weekly/weekly-report-detail.tsx）
- [ ] 6.8 週次通信一覧画面（app/(main)/weekly/page.tsx）
- [ ] 6.9 週次通信詳細画面（app/(main)/weekly/[id]/page.tsx）
- [ ] 6.10 動作確認: ログ入力 → 通信生成 → 一覧表示 → 詳細表示 → 再生成

## フェーズ7: 仕上げ

- [ ] 7.1 レスポンシブ対応確認・調整（全画面）
- [ ] 7.2 エラーハンドリング確認（バリデーション、API、LLM）
- [ ] 7.3 ローディング状態の実装（ボタン、画面読み込み）
- [ ] 7.4 ルートページ（app/page.tsx）- 認証状態に応じたリダイレクト
- [ ] 7.5 テスト作成（lib/date.ts, schemas/）
- [ ] 7.6 リント・型チェック通過確認
- [ ] 7.7 Vercel デプロイ設定・動作確認

---

## 完了条件

- [ ] 全画面がモバイル・PCで正常に表示される
- [ ] メール+パスワード / Google OAuth でログイン・ログアウトできる
- [ ] 日次ログを作成・編集・削除・写真添付できる
- [ ] 週次通信を生成・再生成・閲覧できる
- [ ] 週次通信詳細にその週の写真が表示される
- [ ] RLS が正しく設定されている
- [ ] リント・型チェックが通る
- [ ] Vercel にデプロイ可能な状態である
