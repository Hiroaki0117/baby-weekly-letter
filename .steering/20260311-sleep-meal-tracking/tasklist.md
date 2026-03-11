# 睡眠・食事かんたんトラッキング - タスクリスト

## タスク一覧

### 1. データベース準備

- [ ] `supabase/migrations/20260311100000_create_sleep_records.sql` を作成
  - テーブル定義（id, child_id, sleep_date, started_at, ended_at, duration_minutes, created_at, updated_at）
  - CHECK制約（ended_at > started_at）
  - インデックス（child_id, sleep_date）
  - RLSポリシー（children JOIN で family_id = my_family_id()）
  - updated_at トリガー
- [ ] `supabase/migrations/20260311200000_create_meal_records.sql` を作成
  - テーブル定義（id, child_id, meal_date, meal_type, amount, created_at, updated_at）
  - CHECK制約（meal_type, amount の値制限）
  - インデックス（child_id, meal_date）
  - RLSポリシー（children JOIN で family_id = my_family_id()）
  - updated_at トリガー
- [ ] Supabase で SQL 実行（手動）

### 2. 型定義・スキーマ

- [ ] `src/types/database.ts` に `sleep_records` / `meal_records` テーブル型を追加
- [ ] `src/types/index.ts` に型エイリアス・定数を追加
  - SleepRecord, SleepRecordInsert
  - MealRecord, MealRecordInsert
  - MealType, MealAmount, MEAL_TYPE_OPTIONS, MEAL_AMOUNT_OPTIONS
- [ ] `src/schemas/sleep.ts` を作成（Zodバリデーション）
- [ ] `src/schemas/meal.ts` を作成（Zodバリデーション）

### 3. データ層

- [ ] `src/lib/sleep.ts` を作成
  - fetchSleepRecords, addSleepRecord, updateSleepRecord, deleteSleepRecord
  - calcDurationMinutes（日またぎ対応）
- [ ] `src/lib/meal.ts` を作成
  - fetchMealRecords, addMealRecord, updateMealRecord, deleteMealRecord

### 4. UIコンポーネント（睡眠）

- [ ] `src/components/sleep/sleep-record-form.tsx` を作成
  - 就寝・起床時刻入力、睡眠時間プレビュー、保存/キャンセル
- [ ] `src/components/sleep/sleep-record-list.tsx` を作成
  - 記録一覧表示、編集・削除ボタン

### 5. UIコンポーネント（食事）

- [ ] `src/components/meal/meal-record-form.tsx` を作成
  - 食事種別・量セレクタ、保存/キャンセル
- [ ] `src/components/meal/meal-record-list.tsx` を作成
  - 記録一覧表示、編集・削除ボタン

### 6. ページ統合（家族ページ）

- [ ] `src/app/(main)/family/page.tsx` を変更
  - 睡眠記録セクション追加（体温記録の下）
  - 食事記録セクション追加（睡眠記録の下）
  - データ取得追加（sleep_records, meal_records）

### 7. 統計グラフ

- [ ] `src/components/stats/sleep-chart.tsx` を作成
  - 日別合計睡眠時間の棒グラフ、週ナビゲーション
- [ ] `src/components/stats/meal-chart.tsx` を作成
  - 日別食事量の積み上げ棒グラフ、週ナビゲーション
- [ ] `src/app/(main)/stats/page.tsx` を変更
  - 「からだの記録」タブに睡眠・食事チャートを追加
  - sleep_records / meal_records のデータ取得追加

### 8. ドキュメント更新

- [ ] `docs/functional-design.md` に sleep_records / meal_records テーブル・RLS を追加

### 9. テスト

- [ ] `__tests__/lib/sleep.test.ts` を作成
  - calcDurationMinutes のテスト（通常・日またぎ・境界値）
- [ ] `__tests__/schemas/sleep.test.ts` を作成
- [ ] `__tests__/schemas/meal.test.ts` を作成

### 10. 品質チェック・デプロイ

- [ ] `pnpm lint` 通過
- [ ] `pnpm type-check` 通過
- [ ] `pnpm test` 通過
- [ ] commit & push
