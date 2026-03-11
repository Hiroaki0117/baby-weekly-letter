# 睡眠・食事かんたんトラッキング - 設計

## 1. データモデル

### sleep_records テーブル

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| child_id | uuid | NOT NULL | | FK → children |
| sleep_date | date | NOT NULL | | 記録対象日（就寝日） |
| started_at | timestamptz | NOT NULL | | 就寝時刻 |
| ended_at | timestamptz | NOT NULL | | 起床時刻 |
| duration_minutes | integer | NOT NULL | | 睡眠時間（分）。started_at/ended_at から自動計算して保存 |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- インデックス: (child_id, sleep_date)
- RLS: children JOIN で family_id = my_family_id()
- CHECK: ended_at > started_at

### meal_records テーブル

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| child_id | uuid | NOT NULL | | FK → children |
| meal_date | date | NOT NULL | | 記録対象日 |
| meal_type | text | NOT NULL | | breakfast / lunch / dinner / snack |
| amount | text | NOT NULL | | plenty / normal / little / none |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- インデックス: (child_id, meal_date)
- RLS: children JOIN で family_id = my_family_id()
- CHECK: meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')
- CHECK: amount IN ('plenty', 'normal', 'little', 'none')

## 2. 型定義

### src/types/index.ts に追加

```typescript
export type SleepRecord = Database["public"]["Tables"]["sleep_records"]["Row"];
export type SleepRecordInsert = Database["public"]["Tables"]["sleep_records"]["Insert"];

export type MealRecord = Database["public"]["Tables"]["meal_records"]["Row"];
export type MealRecordInsert = Database["public"]["Tables"]["meal_records"]["Insert"];

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealAmount = "plenty" | "normal" | "little" | "none";

export const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "おやつ" },
];

export const MEAL_AMOUNT_OPTIONS: { value: MealAmount; label: string }[] = [
  { value: "plenty", label: "よく食べた" },
  { value: "normal", label: "ふつう" },
  { value: "little", label: "少なめ" },
  { value: "none", label: "食べなかった" },
];
```

## 3. Zodスキーマ

### src/schemas/sleep.ts

```typescript
import { z } from "zod";

export const sleepRecordSchema = z.object({
  sleep_date: z.string().min(1),
  started_at: z.string().min(1),  // "HH:mm" 形式
  ended_at: z.string().min(1),    // "HH:mm" 形式
});
```

### src/schemas/meal.ts

```typescript
import { z } from "zod";

export const mealRecordSchema = z.object({
  meal_date: z.string().min(1),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  amount: z.enum(["plenty", "normal", "little", "none"]),
});
```

## 4. データ層

### src/lib/sleep.ts

temperature.ts と同じパターンで CRUD 関数を実装。

- `fetchSleepRecords(supabase, childId, date?)` — 睡眠記録一覧取得
- `addSleepRecord(supabase, record)` — 追加（duration_minutes を計算して保存）
- `updateSleepRecord(supabase, id, record)` — 更新
- `deleteSleepRecord(supabase, id)` — 削除
- `calcDurationMinutes(startedAt, endedAt)` — 時刻差分計算（日またぎ対応）

### src/lib/meal.ts

- `fetchMealRecords(supabase, childId, date?)` — 食事記録一覧取得
- `addMealRecord(supabase, record)` — 追加
- `updateMealRecord(supabase, id, record)` — 更新
- `deleteMealRecord(supabase, id)` — 削除

## 5. UIコンポーネント

### 睡眠コンポーネント（体温記録UIと統一）

#### src/components/sleep/sleep-record-form.tsx

- 就寝時刻（`<input type="time">`）と起床時刻（`<input type="time">`）
- 睡眠時間のリアルタイムプレビュー（例: 「9時間30分」）
- 保存/キャンセルボタン
- 編集モード対応

#### src/components/sleep/sleep-record-list.tsx

- 記録一覧を時系列で表示
- 各行: 「21:00 → 06:30（9時間30分）」形式
- 編集（鉛筆アイコン）・削除（ゴミ箱アイコン）ボタン
- 体温記録リストと同じレイアウト・スタイル

### 食事コンポーネント

#### src/components/meal/meal-record-form.tsx

- 食事種別セレクタ（4つのボタンから選択）
- 量セレクタ（4段階のボタンから選択）
- 保存/キャンセルボタン
- 編集モード対応

#### src/components/meal/meal-record-list.tsx

- 記録一覧を種別順で表示
- 各行: 「朝食: ふつう」形式
- 編集・削除ボタン

### 統計グラフ

#### src/components/stats/sleep-chart.tsx

- 直近の1日あたり合計睡眠時間を棒グラフで表示
- X軸: 日付、Y軸: 睡眠時間（時間）
- Recharts BarChart 使用
- 週ナビゲーション（前週/次週）

#### src/components/stats/meal-chart.tsx

- 直近の食事量分布を積み上げ棒グラフで表示
- X軸: 日付、Y軸: 食事回数
- 量ごとに色分け（plenty=緑, normal=青, little=黄, none=赤）
- 週ナビゲーション

## 6. ページ統合

### 家族ページ（src/app/(main)/family/page.tsx）

体温記録セクションの下に睡眠・食事セクションを追加。

```
子ども情報
├── 基本情報
├── 成長記録
├── 体温記録      ← 既存
├── 睡眠記録      ← 新規
└── 食事記録      ← 新規
```

### 統計ページ（src/app/(main)/stats/page.tsx）

「からだの記録」タブ内に睡眠・食事チャートを追加。

```
からだの記録タブ
├── 体温チャート     ← 既存
├── 睡眠チャート     ← 新規
├── 食事チャート     ← 新規
└── 成長曲線        ← 既存
```

## 7. 日またぎ睡眠の扱い

- 就寝時刻 > 起床時刻の場合、日をまたいだと判定
- 例: started_at=21:00, ended_at=06:30 → duration=9.5時間
- `sleep_date` は就寝した日の日付を使用
- timestamptz で保存するため、started_at は sleep_date + 就寝時刻、ended_at は翌日 + 起床時刻で構築
