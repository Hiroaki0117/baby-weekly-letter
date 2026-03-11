# 睡眠・食事かんたんトラッキング - タスクリスト

## タスク一覧

### 1. データベース準備

- [x] `supabase/migrations/20260311100000_create_sleep_records.sql` を作成
- [x] `supabase/migrations/20260311200000_create_meal_records.sql` を作成
- [ ] Supabase で SQL 実行（手動）

### 2. 型定義・スキーマ

- [x] `src/types/database.ts` に `sleep_records` / `meal_records` テーブル型を追加
- [x] `src/types/index.ts` に型エイリアス・定数を追加
- [x] `src/schemas/sleep.ts` を作成（Zodバリデーション）
- [x] `src/schemas/meal.ts` を作成（Zodバリデーション）

### 3. データ層

- [x] `src/lib/sleep.ts` を作成
- [x] `src/lib/meal.ts` を作成

### 4. UIコンポーネント（睡眠）

- [x] `src/components/sleep/sleep-record-form.tsx` を作成
- [x] `src/components/sleep/sleep-record-list.tsx` を作成

### 5. UIコンポーネント（食事）

- [x] `src/components/meal/meal-record-form.tsx` を作成
- [x] `src/components/meal/meal-record-list.tsx` を作成

### 6. ページ統合（家族ページ）

- [x] `src/app/(main)/family/page.tsx` を変更

### 7. 統計グラフ

- [x] `src/components/stats/sleep-chart.tsx` を作成
- [x] `src/components/stats/meal-chart.tsx` を作成
- [x] `src/app/(main)/stats/page.tsx` を変更

### 8. ドキュメント更新

- [x] `docs/functional-design.md` に sleep_records / meal_records テーブル・RLS を追加

### 9. テスト

- [x] `__tests__/lib/sleep.test.ts` を作成
- [x] `__tests__/schemas/sleep.test.ts` を作成
- [x] `__tests__/schemas/meal.test.ts` を作成

### 10. 品質チェック・デプロイ

- [x] `pnpm lint` 通過
- [x] `pnpm type-check` 通過
- [x] `pnpm test` 通過
- [x] commit & push
