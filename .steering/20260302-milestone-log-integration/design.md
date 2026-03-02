# 設計: マイルストーンとログの紐付け・閲覧改善

## 1. DBスキーマ変更

### milestones テーブルに daily_log_id を追加

```sql
ALTER TABLE milestones ADD COLUMN daily_log_id uuid REFERENCES daily_logs(id);
CREATE INDEX idx_milestones_daily_log_id ON milestones(daily_log_id);
```

- nullable: ログから登録しないマイルストーン（AI抽出・過去分追加）は null
- ON DELETE: 制約なし（ログ削除時にマイルストーンは残す）

### TypeScript型定義の更新

`src/types/database.ts` の `milestones` テーブル定義に `daily_log_id` を追加:
- Row: `daily_log_id: string | null`
- Insert: `daily_log_id?: string | null`
- Update: `daily_log_id?: string | null`

`src/types/index.ts` は `Database["public"]["Tables"]["milestones"]["Row"]` を参照しているため自動追従。

## 2. ログフォームの保存フロー修正

### `src/components/log/log-form.tsx`

新規ログ保存時のマイルストーン作成で `daily_log_id` を渡すように変更:

```
現状: createMilestone(supabase, { child_id, title, milestone_date, category, source })
変更: createMilestone(supabase, { child_id, title, milestone_date, category, source, daily_log_id: newLog.id })
```

ログ insert → select → single で取得した `newLog.id` をそのまま使用。

## 3. ログカードにマイルストーンバッジ表示

### データ取得

マイルストーンはログ一覧取得とは別に、表示対象のログIDリストで一括取得する。

`src/lib/milestones.ts` に追加:

```typescript
async function fetchMilestonesByLogIds(
  supabase: Client,
  logIds: string[]
): Promise<Record<string, Milestone>>
```

- `milestones` テーブルから `daily_log_id IN (logIds)` で取得
- 戻り値: `{ [daily_log_id]: Milestone }` のマップ（1ログ1マイルストーン前提）

### 呼び出し元

ログ一覧を取得している各ページで、ログ取得後に `fetchMilestonesByLogIds` を呼びマップを保持:

- `src/app/(main)/page.tsx`（今日ページ）
- `src/app/(main)/calendar/page.tsx`（カレンダーページ）
- `src/app/(main)/logs/page.tsx`（記録ページ）

### LogCard の変更

`src/components/log/log-card.tsx`:

- props に `milestone?: Milestone` を追加（オプショナル）
- カテゴリバッジの上に、マイルストーンがある場合にバッジを表示:
  - スタイル: `✨ {title}` — primary系の目立つバッジ
  - カテゴリバッジ群と視覚的に区別

## 4. 統計ページ成長タブに小項目タブ追加

### `src/app/(main)/stats/page.tsx`

成長タブ内に `growthSubTab` state を追加:

```typescript
type GrowthSubTab = "physical" | "milestones";
const [growthSubTab, setGrowthSubTab] = useState<GrowthSubTab>("physical");
```

タブUI:
- 「身長・体重」(physical) — 既存の GrowthChart
- 「初めての出来事」(milestones) — MilestoneTimeline コンポーネント

### MilestoneTimeline コンポーネント（再作成）

`src/components/stats/milestone-timeline.tsx` に配置（以前は `milestone/` だったが `stats/` に移動）。

機能:
- マイルストーン一覧を時系列表示（新しい順）
- カテゴリフィルタ（全て / 運動 / ことば / 食事 / 生活習慣 / その他）
- 各項目の編集・削除
- 編集ダイアログ（タイトル・日付・カテゴリ・メモ）

サブコンポーネント（すべて同ファイル内 or stats/ 配下）:
- `MilestoneCard` — 個別表示（タイムラインドット + タイトル + 日付 + カテゴリ + 編集/削除）
- `MilestoneEditDialog` — 編集ダイアログ（インライン定義）

## 5. 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/types/database.ts` | milestones に daily_log_id 追加 |
| `src/components/log/log-form.tsx` | マイルストーン保存時に daily_log_id を渡す |
| `src/lib/milestones.ts` | `fetchMilestonesByLogIds` 関数追加 |
| `src/components/log/log-card.tsx` | milestone prop 追加、バッジ表示 |
| `src/app/(main)/page.tsx` | マイルストーンマップ取得・LogCard に渡す |
| `src/app/(main)/calendar/page.tsx` | 同上 |
| `src/app/(main)/logs/page.tsx` | 同上 |
| `src/app/(main)/stats/page.tsx` | 成長タブに小項目タブ追加 |
| `src/components/stats/milestone-timeline.tsx` | タイムラインコンポーネント新規作成 |
| `src/schemas/log.ts` | 変更なし（milestone フィールドは追加済み） |
| `__tests__/lib/milestones.test.ts` | fetchMilestonesByLogIds のテスト追加（必要に応じ） |
