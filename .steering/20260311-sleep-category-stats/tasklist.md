# タスクリスト: 睡眠統計に日中/夜間の区分表示を追加

## 1. DB マイグレーション・型定義

- [x] 1-1. `supabase/migrations/20260311120000_add_sleep_category.sql` を作成（カラム追加 + バックフィル + 制約）
- [x] 1-2. `src/types/database.ts` の sleep_records Row/Insert/Update に `sleep_category` を追加
- [x] 1-3. `src/types/index.ts` に `SleepCategory` 型と `SLEEP_CATEGORY_OPTIONS` 定数を追加

## 2. 判定ロジック・テスト

- [x] 2-1. `src/lib/sleep.ts` に `classifySleep(startedAt)` 関数を追加
- [x] 2-2. `__tests__/lib/sleep.test.ts` に `classifySleep` のテストケースを追加（境界値含む）

## 3. 登録・更新処理の修正

- [x] 3-1. `src/components/sleep/quick-sleep-input.tsx` — `handleRecord()` と `handleManualRecord()` で `sleep_category` を付与
- [x] 3-2. `src/app/(main)/family/page.tsx` — `handleAddSleep()` と `handleUpdateSleep()` で `sleep_category` を付与

## 4. 統計チャートの変更

- [x] 4-1. `src/components/stats/sleep-chart.tsx` を夜間/日中の積み上げ棒グラフに変更（凡例・ツールチップ含む）

## 5. 品質チェック・デプロイ

- [x] 5-1. `pnpm lint && pnpm type-check && pnpm test` を通す
- [x] 5-2. commit & push
