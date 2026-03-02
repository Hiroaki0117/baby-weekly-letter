# マイルストーンと記録の統合 - タスクリスト

## Phase 1: DB・型定義の基盤変更

- [ ] 1-1. マイグレーションSQL作成（`supabase/migrations/`）
  - AI抽出データ（daily_log_id IS NULL）の削除
  - category, source, weekly_report_id, memo カラム削除
  - daily_log_id を NOT NULL 化
- [ ] 1-2. `src/types/database.ts` の Milestone Row/Insert/Update 型更新
- [ ] 1-3. `src/types/index.ts` から MilestoneCategory, MilestoneSource, MILESTONE_CATEGORY_OPTIONS を削除
- [ ] 1-4. `src/schemas/log.ts` の milestoneFieldSchema から category を削除
- [ ] 1-5. `src/lib/milestones.ts` の関数整理
  - `saveMilestones()` 削除
  - `fetchMilestones()` 削除
  - `createMilestone()` から category, source, memo 引数を除去
  - `updateMilestone()` をタイトル・日付のみに簡素化

## Phase 2: AI抽出の廃止

- [ ] 2-1. `src/lib/milestones/extract.ts` を削除
- [ ] 2-2. `src/lib/milestones/extract-prompt.ts` を削除
- [ ] 2-3. `src/app/api/weekly-report/generate/route.ts` からAI抽出呼び出しを削除
  - extractMilestones / saveMilestones の import・呼び出し・レスポンスを除去

## Phase 3: ログフォーム変更

- [ ] 3-1. `src/components/log/log-form.tsx` のマイルストーン入力部を変更
  - カテゴリ `<select>` を削除
  - createMilestone 呼び出しから不要引数を除去
  - タイトル空の場合は本文先頭30文字をフォールバック

## Phase 4: /logs ページ フィルター統合

- [ ] 4-1. `src/components/log/log-filter.tsx` に「初めての出来事あり」トグル追加
  - Props: milestoneOnly, onMilestoneOnlyChange
  - activeFilterCount に加算
- [ ] 4-2. `src/app/(main)/logs/page.tsx` のフィルターロジック追加
  - milestoneOnly 状態管理
  - filteredLogs に milestoneMap チェック追加
  - clearFilters に追加
- [ ] 4-3. `src/components/log/log-card.tsx` のアクセントカラー分岐
  - milestone 有無で AccentCard の accent を primary / amber に切り替え

## Phase 5: 統計ページ再構成

- [ ] 5-1. `src/app/(main)/stats/page.tsx` の成長タブからサブタブ・MilestoneTimeline を削除
  - GrowthChart のみ直接表示
- [ ] 5-2. 記録タブに「初めての出来事 N件」サマリーカード追加
  - 期間内ログの milestoneMap から集計
- [ ] 5-3. `src/components/stats/milestone-timeline.tsx` を削除

## Phase 6: カレンダー マイルストーンマーク

- [ ] 6-1. `src/components/calendar/calendar-day-cell.tsx` に hasMilestone prop 追加
  - スターマーク表示
- [ ] 6-2. `src/app/(main)/calendar/page.tsx` から hasMilestone を算出して渡す

## Phase 7: クリーンアップ・検証

- [ ] 7-1. 不要な import・参照の全ファイル掃除
  - MILESTONE_CATEGORY_OPTIONS, MilestoneCategory 等の残留参照を除去
- [ ] 7-2. テストの更新（`__tests__/` 配下のマイルストーン関連）
- [ ] 7-3. 品質チェック（lint, type-check, test）
- [ ] 7-4. commit & push
