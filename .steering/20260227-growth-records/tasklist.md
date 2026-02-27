# タスクリスト: 身長・体重記録（v3.1）

## Phase 1: DB・型定義

- [ ] 1.1 Supabaseマイグレーション作成（`children.gender` カラム追加）
- [ ] 1.2 Supabaseマイグレーション作成（`growth_records` テーブル + RLSポリシー）
- [ ] 1.3 `src/types/database.ts` に `children.gender` と `growth_records` 型を追加
- [ ] 1.4 `src/types/index.ts` に `GrowthRecord`, `GrowthRecordInsert`, `Gender` 型を追加

## Phase 2: スキーマ・ユーティリティ

- [ ] 2.1 `src/schemas/growth.ts` 新規作成（Zodバリデーションスキーマ）
- [ ] 2.2 `src/lib/growth.ts` 新規作成（CRUD関数 + 月齢計算ユーティリティ）
- [ ] 2.3 `src/lib/growth-standards.ts` 新規作成（厚労省パーセンタイルデータ）

## Phase 3: コンポーネント実装

- [ ] 3.1 `src/components/growth/growth-record-form.tsx` 新規作成（入力フォーム）
- [ ] 3.2 `src/components/growth/growth-record-list.tsx` 新規作成（一覧表示 + 編集・削除）
- [ ] 3.3 `src/components/stats/growth-chart.tsx` 新規作成（成長曲線グラフ）

## Phase 4: 画面統合

- [ ] 4.1 家族画面（`family/page.tsx`）に性別選択を追加
- [ ] 4.2 家族画面に成長記録セクションを追加（フォーム + 一覧 + コンパクトグラフ）
- [ ] 4.3 統計ダッシュボード（`stats/page.tsx`）に成長曲線セクションを追加

## Phase 5: 品質チェック

- [ ] 5.1 `pnpm lint` 通過
- [ ] 5.2 `pnpm type-check` 通過
- [ ] 5.3 `pnpm test` 通過
- [ ] 5.4 動作確認（成長記録の追加・編集・削除・グラフ表示）
