# 成長タイムライン - タスクリスト

## Phase 1: DB + 型 + スキーマ

- [ ] マイグレーションSQL作成（milestones テーブル + RLS + トリガー）
- [ ] src/types/database.ts に milestones の Row/Insert/Update 型追加
- [ ] src/types/index.ts に Milestone, MilestoneCategory, MilestoneSource, MILESTONE_CATEGORY_OPTIONS 追加
- [ ] src/schemas/milestone.ts 作成（Zod バリデーション）
- [ ] __tests__/schemas/milestone.test.ts 作成

## Phase 2: CRUD関数

- [ ] src/lib/milestones.ts 作成（fetchMilestones, createMilestone, updateMilestone, deleteMilestone）
- [ ] saveMilestones 関数作成（重複チェック付き一括保存）

## Phase 3: AI抽出

- [ ] src/lib/milestones/extract-prompt.ts 作成（抽出プロンプト構築）
- [ ] src/lib/milestones/extract.ts 作成（Gemini呼び出し + JSONパース）
- [ ] src/app/api/weekly-report/generate/route.ts 拡張（抽出→保存→レスポンス追加）

## Phase 4: タイムラインUI

- [ ] src/components/milestone/milestone-category-filter.tsx 作成
- [ ] src/components/milestone/milestone-card.tsx 作成
- [ ] src/components/milestone/milestone-timeline.tsx 作成（フィルタ+リスト+追加ボタン）
- [ ] src/app/(main)/stats/page.tsx 成長タブにタイムライン組み込み

## Phase 5: 追加・編集・削除UI

- [ ] src/components/milestone/milestone-form.tsx 作成（ダイアログ形式）
- [ ] MilestoneTimeline に追加フロー組み込み
- [ ] MilestoneCard に編集・削除フロー組み込み

## Phase 6: 通知連携

- [ ] 週次通信生成後の画面で extractedMilestones のトースト通知表示
- [ ] src/app/(main)/logs/page.tsx の生成完了ハンドラ修正

## Phase 7: 品質チェック + 完了

- [ ] pnpm lint
- [ ] pnpm type-check
- [ ] pnpm test
- [ ] commit + push
- [ ] docs/product-requirements.md の v3.3 ステータスを「実装済み」に更新
