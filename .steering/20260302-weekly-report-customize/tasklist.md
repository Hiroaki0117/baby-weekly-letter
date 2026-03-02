# 週次通信カスタマイズ - タスクリスト

## フェーズ 1: データ層

- [ ] 1-1. マイグレーション作成（`report_preferences` テーブル + RLS）
- [ ] 1-2. `src/types/database.ts` に `report_preferences` テーブル型を追加
- [ ] 1-3. `src/types/index.ts` に `ReportTone`, `ReportSection`, `ReportPreferences` 型を追加
- [ ] 1-4. `src/schemas/report-preferences.ts` を新規作成（Zod スキーマ）
- [ ] 1-5. `src/lib/report-preferences.ts` を新規作成（fetch / upsert）
- [ ] 1-6. テスト: `__tests__/schemas/report-preferences.test.ts`

## フェーズ 2: プロンプト改修

- [ ] 2-1. トーン定義データを作成（各トーンの役割説明 + 文体ガイドライン文面）
- [ ] 2-2. セクション定義データを作成（各セクションの構成ガイド文面、週次用・月次用）
- [ ] 2-3. `src/lib/weekly-report/prompt.ts` を改修（`buildPrompt` に `ReportPreferences` 引数追加、トーン・セクション反映）
- [ ] 2-4. `src/lib/weekly-report/generate.ts` を改修（引数に `ReportPreferences` 追加）
- [ ] 2-5. `src/lib/monthly-report/prompt.ts` を改修（`buildMonthlyPrompt` に `ReportPreferences` 引数追加、トーン・セクション反映）
- [ ] 2-6. `src/lib/monthly-report/generate.ts` を改修（引数に `ReportPreferences` 追加）

## フェーズ 3: API ルート改修

- [ ] 3-1. `src/app/api/weekly-report/generate/route.ts` を改修（設定取得 → プロンプトに反映）
- [ ] 3-2. `src/app/api/monthly-report/generate/route.ts` を改修（設定取得 → プロンプトに反映）

## フェーズ 4: 設定UI

- [ ] 4-1. `src/components/settings/report-preferences-form.tsx` を新規作成（トーン選択 + セクション構成フォーム）
- [ ] 4-2. `src/app/(main)/settings/page.tsx` に通信設定セクションを追加

## フェーズ 5: 品質チェック・リリース

- [ ] 5-1. lint / type-check / test を実行し、エラーがあれば修正
- [ ] 5-2. commit → push
