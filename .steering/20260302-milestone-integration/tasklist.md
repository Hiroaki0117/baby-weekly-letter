# マイルストーンと記録の統合 - タスクリスト

## Phase 1: DB・型定義の基盤変更

- [x] 1-1. マイグレーションSQL作成（`supabase/migrations/`）
- [x] 1-2. `src/types/database.ts` の Milestone Row/Insert/Update 型更新
- [x] 1-3. `src/types/index.ts` から MilestoneCategory, MilestoneSource, MILESTONE_CATEGORY_OPTIONS を削除
- [x] 1-4. `src/schemas/log.ts` の milestoneFieldSchema から category を削除
- [x] 1-5. `src/lib/milestones.ts` の関数整理

## Phase 2: AI抽出の廃止

- [x] 2-1. `src/lib/milestones/extract.ts` を削除
- [x] 2-2. `src/lib/milestones/extract-prompt.ts` を削除
- [x] 2-3. `src/app/api/weekly-report/generate/route.ts` からAI抽出呼び出しを削除

## Phase 3: ログフォーム変更

- [x] 3-1. `src/components/log/log-form.tsx` のマイルストーン入力部を変更

## Phase 4: /logs ページ フィルター統合

- [x] 4-1. `src/components/log/log-filter.tsx` に「初めての出来事あり」トグル追加
- [x] 4-2. `src/app/(main)/logs/page.tsx` のフィルターロジック追加
- [x] 4-3. `src/components/log/log-card.tsx` のアクセントカラー分岐

## Phase 5: 統計ページ再構成

- [x] 5-1. `src/app/(main)/stats/page.tsx` の成長タブからサブタブ・MilestoneTimeline を削除
- [x] 5-2. 記録タブに「初めての出来事 N件」サマリーカード追加
- [x] 5-3. `src/components/stats/milestone-timeline.tsx` を削除

## Phase 6: カレンダー マイルストーンマーク

- [x] 6-1. `src/components/calendar/calendar-day-cell.tsx` に hasMilestone prop 追加
- [x] 6-2. `src/app/(main)/calendar/page.tsx` から hasMilestone を算出して渡す

## Phase 7: クリーンアップ・検証

- [x] 7-1. 不要な import・参照の全ファイル掃除
- [x] 7-2. テストの更新（`__tests__/` 配下のマイルストーン関連）
- [x] 7-3. 品質チェック（lint, type-check, test）
- [x] 7-4. commit & push
