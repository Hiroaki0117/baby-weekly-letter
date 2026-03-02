# マイルストーンと記録の統合 - 設計書

## 設計方針

マイルストーンを独立エンティティから「記録の付属フラグ」に簡素化する。
既存の `milestones` テーブルは残すが、不要カラムを削除し `daily_log_id` を NOT NULL 化する。

---

## 1. DBスキーマ変更

### マイグレーション: `milestones` テーブル簡素化

**Step 1: AI抽出データ削除**
```sql
DELETE FROM milestones WHERE daily_log_id IS NULL;
```

**Step 2: カラム削除 & NOT NULL化**
```sql
ALTER TABLE milestones DROP COLUMN category;
ALTER TABLE milestones DROP COLUMN source;
ALTER TABLE milestones DROP COLUMN weekly_report_id;
ALTER TABLE milestones DROP COLUMN memo;
ALTER TABLE milestones ALTER COLUMN daily_log_id SET NOT NULL;
```

**変更後のスキーマ:**
```
milestones
├── id: uuid (PK)
├── child_id: uuid (NOT NULL, FK → children)
├── daily_log_id: uuid (NOT NULL, FK → daily_logs)
├── title: text (NOT NULL, max 100)
├── milestone_date: date (NOT NULL)
├── created_at: timestamptz
└── updated_at: timestamptz
```

### 対象ファイル
- `supabase/migrations/YYYYMMDDHHMMSS_simplify_milestones.sql` — 新規作成
- `src/types/database.ts` — Milestone Row/Insert/Update 型を更新

---

## 2. 型定義・スキーマ変更

### `src/types/index.ts`
- `MilestoneCategory` 型を削除
- `MilestoneSource` 型を削除
- `MILESTONE_CATEGORY_OPTIONS` 定数を削除

### `src/types/database.ts`
- `milestones` の Row/Insert/Update から `category`, `source`, `weekly_report_id`, `memo` を削除
- `daily_log_id` を `string`（NOT NULL）に変更

### `src/schemas/log.ts`
- `milestoneFieldSchema` から `category` を削除
- 結果: `z.object({ title: z.string().min(1).max(100) })`

---

## 3. ログフォーム変更

### `src/components/log/log-form.tsx`

**Before:**
```
✨ はじめてできたこと [トグル]
  └ タイトル入力
  └ カテゴリ選択 ← 削除
```

**After:**
```
✨ はじめてできたこと [トグル]
  └ タイトル入力（任意。空なら本文先頭30文字を自動採用）
```

**変更内容:**
- カテゴリ `<select>` を削除
- `createMilestone()` 呼び出しから `category`, `source` を除去
- タイトル空の場合のフォールバック: `values.text.slice(0, 30)` をタイトルに使用

---

## 4. マイルストーンライブラリ変更

### `src/lib/milestones.ts`

**削除する関数:**
- `saveMilestones()` — AI一括保存用（重複排除ロジック含む）、不要に
- `fetchMilestones()` — 子供ID指定で全件取得（MilestoneTimeline用）、不要に

**残す関数:**
- `fetchMilestonesByLogIds()` — ログIDからマイルストーン取得。変更なし
- `createMilestone()` — 引数から `category`, `source`, `memo` を除去
- `updateMilestone()` — タイトル・日付のみ更新可能に簡素化
- `deleteMilestone()` — 変更なし

### 削除するファイル
- `src/lib/milestones/extract.ts` — AI抽出ロジック
- `src/lib/milestones/extract-prompt.ts` — AI抽出プロンプト

---

## 5. /logs ページ フィルター統合

### `src/components/log/log-filter.tsx`

**追加: 「初めての出来事」フィルター**
- カテゴリフィルターの下に配置
- トグルボタン1つ:「✨ 初めての出来事あり」
- ON時: マイルストーン付きログのみ表示

**Props追加:**
```typescript
milestoneOnly: boolean;
onMilestoneOnlyChange: (v: boolean) => void;
```

**activeFilterCount** に `milestoneOnly ? 1 : 0` を加算

### `src/app/(main)/logs/page.tsx`

**フィルターロジック追加:**
```typescript
const [milestoneOnly, setMilestoneOnly] = useState(false);

const filteredLogs = useMemo(() => {
  return logs.filter((log) => {
    // ... 既存フィルター ...
    if (milestoneOnly && !milestoneMap[log.id]) return false;
    return true;
  });
}, [logs, ..., milestoneOnly, milestoneMap]);
```

**clearFilters に追加:** `setMilestoneOnly(false)`

### LogCard のアクセントカラー分岐

`src/components/log/log-card.tsx`:
```typescript
<AccentCard accent={milestone ? "amber" : "primary"}>
```
マイルストーン付きログは amber アクセントで視覚的に区別。

---

## 6. 統計ページ再構成

### `src/app/(main)/stats/page.tsx`

**成長タブ:**
- サブタブ（身長・体重 / 初めての出来事）を廃止
- GrowthChart のみ直接表示

**記録タブ:**
- 既存: MoodChart + CategoryPieChart
- 追加: 「初めての出来事」サマリーカード
  - 表示内容: 期間内のマイルストーン件数
  - データ取得: 表示中のログの milestoneMap から集計

**削除:**
- `MilestoneTimeline` コンポーネントの import・使用を削除

### `src/components/stats/milestone-timeline.tsx`
- ファイルごと削除

---

## 7. カレンダー マイルストーンマーク

### `src/components/calendar/calendar-day-cell.tsx`

**Props追加:**
```typescript
hasMilestone?: boolean;
```

**表示:** ログ件数バッジの左隣にスターマーク
```tsx
{hasMilestone && (
  <span className="absolute left-0.5 top-0.5 text-[10px] leading-none text-amber-500">
    ✨
  </span>
)}
```

### `src/app/(main)/calendar/page.tsx`

- 既に `milestoneMap` を取得済み
- CalendarDayCell に `hasMilestone` を渡す:
  - その日のログIDのいずれかが milestoneMap に存在するかチェック

---

## 8. 週次通信生成 API からAI抽出を削除

### `src/app/api/weekly-report/generate/route.ts`

**削除:**
- `extractMilestones()` 呼び出し（L139-158）
- `saveMilestones()` 呼び出し
- レスポンスの `extractedMilestones` フィールド
- import: `extractMilestones`, `saveMilestones`

**通信生成自体は残す**（マイルストーンとは独立した機能）

---

## 9. 削除対象まとめ

### ファイル削除
- `src/lib/milestones/extract.ts`
- `src/lib/milestones/extract-prompt.ts`
- `src/components/stats/milestone-timeline.tsx`

### 型・定数削除
- `MilestoneCategory` 型
- `MilestoneSource` 型
- `MILESTONE_CATEGORY_OPTIONS` 定数
- `milestoneFieldSchema` の `category` フィールド

### 関数削除
- `saveMilestones()` in `src/lib/milestones.ts`
- `fetchMilestones()` in `src/lib/milestones.ts`

---

## 10. 影響範囲の確認が必要なファイル

以下のファイルで `MilestoneCategory`, `MILESTONE_CATEGORY_OPTIONS`, `source`, `category` (マイルストーン文脈) の参照を確認し、修正・削除する:

- `src/app/(main)/page.tsx` (ホームページ) — マイルストーン表示がある場合
- `src/app/(main)/calendar/page.tsx` — milestoneMap の使い方確認
- `__tests__/` 配下 — マイルストーン関連テストの更新

---

## 11. 検証手順

```bash
# 1. 品質チェック
pnpm lint
pnpm type-check
pnpm test

# 2. ブラウザ確認
# - ログフォーム: トグルON → タイトル入力のみ、カテゴリ選択なし
# - /logs: 「初めての出来事あり」フィルターで絞り込み
# - /logs: マイルストーン付きログがamberカード
# - /stats 記録タブ: サマリーカード表示
# - /stats 成長タブ: 身長体重のみ、サブタブなし
# - /calendar: マイルストーン日にスターマーク
# - 週次通信生成: AI抽出なしで正常に通信生成される
```
