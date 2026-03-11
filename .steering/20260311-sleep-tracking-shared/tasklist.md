# タスクリスト: 睡眠計測状態の家族間共有

## 1. データベース

- [ ] 1-1. `sleep_tracking` テーブルのマイグレーションSQL作成
- [ ] 1-2. `src/types/database.ts` に `sleep_tracking` の型定義を追加
- [ ] 1-3. `src/types/index.ts` に `SleepTracking` 型を追加

## 2. ライブラリ

- [ ] 2-1. `src/lib/sleep.ts` に `fetchActiveTracking` / `startTracking` / `stopTracking` を追加

## 3. コンポーネント

- [ ] 3-1. `src/components/sleep/quick-sleep-input.tsx` を改修
  - localStorage関連コードを削除
  - props で `activeTracking` を受け取る
  - 開始/終了/取消でサーバー側関数を呼び出す

## 4. ページ

- [ ] 4-1. `src/app/(main)/family/page.tsx` を改修
  - `fetchActiveTracking()` で計測中データを取得
  - `QuickSleepInput` に `activeTracking` を渡す

## 5. 品質チェック

- [ ] 5-1. `pnpm lint` / `pnpm type-check` / `pnpm test` を実行
- [ ] 5-2. commit & push
