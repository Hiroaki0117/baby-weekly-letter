# v3.5 体温記録 - タスクリスト

## フェーズ1: データ層

- [x] 1-1. マイグレーション作成（`temperature_records` テーブル + RLS）
- [x] 1-2. `database.ts` に temperature_records 型を手動追加
- [x] 1-3. `src/types/index.ts` に TemperatureRecord / TemperatureRecordInsert を追加
- [x] 1-4. `src/schemas/temperature.ts` 新規作成（Zodスキーマ）
- [x] 1-5. `src/lib/temperature.ts` 新規作成（CRUD関数）
- [x] 1-6. `__tests__/schemas/temperature.test.ts` 新規作成（スキーマテスト）

## フェーズ2: 入力UI（家族ページ）

- [x] 2-1. `src/components/temperature/temperature-record-form.tsx` 新規作成
- [x] 2-2. `src/components/temperature/temperature-record-list.tsx` 新規作成
- [x] 2-3. `src/app/(main)/family/page.tsx` に体温記録セクションを統合

## フェーズ3: グラフ表示（統計ページ）

- [x] 3-1. `src/components/stats/temperature-chart.tsx` 新規作成
- [x] 3-2. `src/app/(main)/stats/page.tsx` のタブ名変更（「成長」→「からだの記録」）
- [x] 3-3. `src/app/(main)/stats/page.tsx` に体温データ取得・TemperatureChart 配置

## フェーズ4: 品質チェック・仕上げ

- [x] 4-1. lint / type-check / test 通過確認
- [x] 4-2. 永続的ドキュメント更新（`docs/functional-design.md`, `docs/product-requirements.md`）
- [x] 4-3. コミット・プッシュ
