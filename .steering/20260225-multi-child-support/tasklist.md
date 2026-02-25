# 複数子供対応 - タスクリスト

## Phase 1: データ基盤

### Task 1.1: DBマイグレーション
- [ ] `supabase/migrations/20260225000000_add_child_id.sql` を作成
  - `daily_logs` に `child_id` カラム追加（nullable）
  - `weekly_reports` に `child_id` カラム追加（nullable）
  - `monthly_reports` に `child_id` カラム追加（nullable）
  - 既存データに最初の子供のIDを割り当て
  - NOT NULL制約を追加
  - ユニーク制約を更新（`weekly_reports`, `monthly_reports`）
  - インデックス追加
- [ ] Supabase にマイグレーションを適用

### Task 1.2: TypeScript型の更新
- [ ] `src/types/database.ts` を更新
  - `daily_logs` の Row / Insert / Update に `child_id` 追加
  - `weekly_reports` の Row / Insert / Update に `child_id` 追加
  - `monthly_reports` の Row / Insert / Update に `child_id` 追加

## Phase 2: 共通コンポーネント

### Task 2.1: 子供セレクタコンポーネント
- [ ] `src/components/child/child-selector.tsx` を新規作成
  - props: `children`, `selectedId`, `onChange`
  - 気分セレクタと同様のトグルボタンスタイル

### Task 2.2: 子供バッジコンポーネント
- [ ] `src/components/child/child-badge.tsx` を新規作成
  - props: `name`
  - プライマリカラー系のバッジスタイル

## Phase 3: 記録機能

### Task 3.1: 記録フォームの子供対応
- [ ] `src/schemas/log.ts` に `child_id` フィールドを追加
- [ ] `src/components/log/log-form.tsx` を修正
  - props に `children: Child[]` を追加
  - 子供が2人以上 → 子供セレクタ表示
  - 子供が1人 → 非表示で自動選択
  - insert / update に `child_id` を含める

### Task 3.2: 記録カードの子供名表示
- [ ] `src/components/log/log-card.tsx` を修正
  - props に `childName?: string | null` を追加
  - 日付行に ChildBadge を表示

### Task 3.3: 記録一覧ページの対応
- [ ] `src/app/(main)/logs/page.tsx` を修正
  - 子供データを取得
  - LogForm に `children` を渡す
  - LogCard に `childName` を渡す

### Task 3.4: 記録フィルターの子供対応
- [ ] `src/components/log/log-filter.tsx` を修正
  - props に `children`, `selectedChildIds`, `onChildIdsChange` を追加
  - 子供が2人以上の場合のみ子供フィルターセクションを表示
- [ ] `src/app/(main)/logs/page.tsx` にフィルターstate・ロジック追加

## Phase 4: 今日ページ・カレンダー

### Task 4.1: 今日ページの複数子供表示
- [ ] `src/app/(main)/page.tsx` を修正
  - 子供を全件取得（`.limit(1)` を除去）
  - 全員分の月齢を表示
  - LogForm に `children` を渡す
  - LogCard に `childName` を渡す

### Task 4.2: カレンダーページの対応
- [ ] `src/app/(main)/calendar/page.tsx` を修正
  - 子供データを取得
  - LogForm に `children` を渡す
  - LogCard に `childName` を渡す

## Phase 5: 通信機能

### Task 5.1: 週次通信生成APIの対応
- [ ] `src/app/api/weekly-report/generate/route.ts` を修正
  - リクエストに `childId` パラメータを追加
  - 指定 `child_id` のログのみ取得
  - 該当子供の情報をプロンプトに渡す
  - `weekly_reports` に `child_id` を含めて保存

### Task 5.2: 月次まとめ生成APIの対応
- [ ] `src/app/api/monthly-report/generate/route.ts` を修正
  - リクエストに `childId` パラメータを追加
  - 指定 `child_id` の週次通信のみ取得
  - 該当子供の情報をプロンプトに渡す
  - `monthly_reports` に `child_id` を含めて保存

### Task 5.3: 通信一覧ページの子供タブ対応
- [ ] `src/app/(main)/weekly/page.tsx` を修正
  - 子供データを取得
  - 子供が2人以上 → タブUI表示
  - 子供が1人 → タブ非表示
  - 選択中の子供の `child_id` で通信をフィルター
  - 生成時に `childId` をAPIへ送信

### Task 5.4: 通信詳細ページの子供名表示
- [ ] `src/app/(main)/weekly/[id]/page.tsx` を修正
  - ヘッダーに子供名を表示
- [ ] `src/app/(main)/weekly/monthly/[id]/page.tsx` を修正
  - ヘッダーに子供名を表示

## Phase 6: 家族・オンボーディング

### Task 6.1: 家族ページの複数子供管理
- [ ] `src/app/(main)/family/page.tsx` を修正
  - 子供を全件取得して一覧表示
  - 各子供の編集機能（名前・生年月日）
  - 「＋ お子さまを追加」ボタンと追加フォーム

### Task 6.2: オンボーディングの複数子供登録
- [ ] `src/schemas/family.ts` を修正
  - `childName` / `childBirthDate` → `children` 配列に変更
- [ ] `src/app/(auth)/onboarding/page.tsx` を修正
  - Step 3 で複数子供を登録可能に
  - 「＋ もう1人追加」ボタン
  - 各子供の「✕」削除ボタン（最低1人は残す）

### Task 6.3: 家族作成APIの複数子供対応
- [ ] `src/app/api/family/create/route.ts` を修正
  - `children` 配列を受け取りループで insert
  - 旧パラメータ（`childName`）のフォールバック対応

## Phase 7: 品質チェック

### Task 7.1: テスト・品質チェック
- [ ] `pnpm lint` パス
- [ ] `pnpm type-check` パス
- [ ] `pnpm test` パス
- [ ] 既存テストの修正（スキーマ変更に伴う）

### Task 7.2: 動作確認
- [ ] 子供1人のユーザー: 既存動作に影響がないこと
- [ ] 子供2人以上: 記録・通信・フィルターが正しく動作すること
- [ ] オンボーディング: 複数子供の登録ができること
- [ ] 家族ページ: 子供の追加・編集ができること
- [ ] 既存データ: マイグレーション後にchild_idが正しく割り当てられること
