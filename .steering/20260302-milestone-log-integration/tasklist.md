# タスクリスト: マイルストーンとログの紐付け・閲覧改善

## フェーズ1: DB・型定義の変更

- [ ] 1-1. `src/types/database.ts` の milestones に `daily_log_id` を追加
- [ ] 1-2. `src/components/log/log-form.tsx` のマイルストーン保存時に `daily_log_id` を渡す

## フェーズ2: ログカードにマイルストーンバッジ表示

- [ ] 2-1. `src/lib/milestones.ts` に `fetchMilestonesByLogIds` 関数を追加
- [ ] 2-2. `src/components/log/log-card.tsx` に `milestone` prop とバッジUIを追加
- [ ] 2-3. `src/app/(main)/page.tsx`（今日ページ）でマイルストーンマップを取得しLogCardに渡す
- [ ] 2-4. `src/app/(main)/calendar/page.tsx`（カレンダーページ）で同様の対応
- [ ] 2-5. `src/app/(main)/logs/page.tsx`（記録ページ）で同様の対応

## フェーズ3: 統計ページ成長タブに小項目タブ追加

- [ ] 3-1. `src/components/stats/milestone-timeline.tsx` を新規作成（タイムライン・フィルタ・編集・削除）
- [ ] 3-2. `src/app/(main)/stats/page.tsx` に成長小項目タブ（身長・体重 / 初めての出来事）を追加

## フェーズ4: 品質チェック

- [ ] 4-1. `pnpm lint && pnpm type-check && pnpm test` 通過確認
- [ ] 4-2. commit → push
