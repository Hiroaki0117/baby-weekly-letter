# 年次アルバム自動生成 - タスクリスト

## タスク一覧

### 1. データベース準備

- [ ] `annual_reports` テーブル作成SQL を用意
  - テーブル定義（id, family_id, child_id, fiscal_year, content, generated_at, created_at）
  - ユニーク制約（family_id, child_id, fiscal_year）
  - RLS ポリシー（children JOIN で family_id = my_family_id()）
  - インデックス（child_id, fiscal_year）
- [ ] Supabase で SQL 実行（手動）

### 2. 型定義・スキーマ

- [ ] `src/types/index.ts` に `AnnualReport` 型と `AnnualReportContent` 型を追加
- [ ] `src/schemas/annual-report.ts` を作成（Zod バリデーション: fiscalYear, childId）

### 3. データ収集ユーティリティ

- [ ] `src/lib/annual-report/data.ts` を作成
  - `getFiscalYearRange(fiscalYear)` — 年度の開始・終了日を計算
  - `canGenerate(fiscalYear)` — 生成可能時期の判定（3月1日以降）
  - `isInCooldown(generatedAt)` — 24時間クールダウン判定
  - `getMonthlyPhotoPaths(supabase, childId, start, end)` — 各月の最新写真パスを取得
  - `getGrowthSummary(supabase, childId, start, end)` — 成長データサマリー取得

### 4. AI生成（プロンプト・Gemini呼び出し）

- [ ] `src/lib/annual-report/prompt.ts` を作成
  - 月次まとめ・週次通信・マイルストーン・成長データからプロンプト構築
  - JSON形式で月ハイライト文 + 総括メッセージを出力指示
  - トーン設定の反映
- [ ] `src/lib/annual-report/generate.ts` を作成
  - Gemini 呼び出し + JSON パース + `AnnualReportContent` 構造への整形

### 5. API Route Handler

- [ ] `src/app/api/annual-report/generate/route.ts` を作成
  - 認証・家族ID・バリデーション
  - 生成時期チェック・クールダウンチェック
  - データ収集 → Gemini 生成 → upsert
  - エラーハンドリング（時期外・クールダウン・データなし）

### 6. タブ拡張

- [ ] `src/components/log/logs-tabs.tsx` を変更
  - `LogsTab` 型に `"annual"` を追加
  - `reportTabs` に年次タブを追加

### 7. UI コンポーネント

- [ ] `src/components/annual/annual-report-card.tsx` を作成
  - 年次アルバム一覧のカード表示（年度・生成日時・クールダウン状態）
- [ ] `src/components/annual/annual-album-view.tsx` を作成
  - アルバム閲覧ビュー（表紙・月別・マイルストーン・成長・総括）
  - PDFダウンロードボタン
- [ ] `src/components/export/annual-export-layout.tsx` を作成
  - PDF出力用の複数ページレイアウト

### 8. ログページ統合

- [ ] `src/app/(main)/logs/page.tsx` を変更
  - 年次タブのデータ取得（`annual_reports` からfetch）
  - 年度・子供選択 → 生成ボタン → API呼び出し
  - 生成済みアルバムの表示・PDFダウンロード
  - クールダウン状態の表示

### 9. ドキュメント更新

- [ ] `docs/functional-design.md` に `annual_reports` テーブル・RLS・ER図を追加

### 10. テスト

- [ ] `__tests__/lib/annual-report.test.ts` を作成
  - `getFiscalYearRange` のテスト
  - `canGenerate` のテスト（境界値: 2月28日、3月1日）
  - `isInCooldown` のテスト（24時間前後の境界値）
- [ ] `__tests__/schemas/annual-report.test.ts` を作成
  - Zodスキーマのバリデーションテスト

### 11. 品質チェック・デプロイ

- [ ] `pnpm lint` 通過
- [ ] `pnpm type-check` 通過
- [ ] `pnpm test` 通過
- [ ] commit & push
