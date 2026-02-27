# 設計: 身長・体重記録（v3.1）

## 実装アプローチ

### 1. DBマイグレーション

#### 1.1 `children` テーブルに `gender` カラム追加

```sql
ALTER TABLE children ADD COLUMN gender text;
-- 値: 'male' / 'female' / NULL（未設定）
```

#### 1.2 `growth_records` テーブル新規作成

```sql
CREATE TABLE growth_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  measured_date date NOT NULL,
  height_cm numeric(5,1),  -- 身長 cm（小数点1桁）
  weight_kg numeric(5,2),  -- 体重 kg（小数点2桁）
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT height_or_weight CHECK (height_cm IS NOT NULL OR weight_kg IS NOT NULL)
);

CREATE INDEX idx_growth_records_child_date ON growth_records(child_id, measured_date);
```

#### 1.3 RLSポリシー

```sql
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- SELECT: 家族スコープ
CREATE POLICY select_family_growth ON growth_records FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

-- INSERT: 家族スコープ
CREATE POLICY insert_family_growth ON growth_records FOR INSERT WITH CHECK (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

-- UPDATE: 家族スコープ
CREATE POLICY update_family_growth ON growth_records FOR UPDATE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

-- DELETE: 家族スコープ
CREATE POLICY delete_family_growth ON growth_records FOR DELETE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);
```

### 2. 型定義の更新

#### `src/types/database.ts`

`children` に `gender` フィールドを追加。`growth_records` テーブル定義を追加。

#### `src/types/index.ts`

```typescript
export type GrowthRecord = Database["public"]["Tables"]["growth_records"]["Row"];
export type GrowthRecordInsert = Database["public"]["Tables"]["growth_records"]["Insert"];

export type Gender = "male" | "female";
```

### 3. Zodスキーマ

#### `src/schemas/growth.ts`（新規）

```typescript
export const growthRecordSchema = z.object({
  measured_date: z.string().min(1, "計測日を入力してください"),
  height_cm: z.number().min(20).max(200).nullable(),
  weight_kg: z.number().min(0.5).max(100).nullable(),
}).refine(
  (data) => data.height_cm !== null || data.weight_kg !== null,
  { message: "身長か体重のいずれかを入力してください" }
);
```

### 4. コンポーネント設計

#### 4.1 家族画面の変更（`src/app/(main)/family/page.tsx`）

子供プロフィールの編集フォームに以下を追加:
- 性別選択（男の子 / 女の子 / 未設定）
- 「成長記録」セクション（成長記録の一覧・追加・編集・削除）

#### 4.2 新規コンポーネント

| コンポーネント | 配置 | 用途 |
|---------------|------|------|
| `GrowthRecordForm` | `components/growth/` | 成長記録の入力フォーム（追加・編集兼用） |
| `GrowthRecordList` | `components/growth/` | 成長記録の一覧表示（編集・削除操作） |
| `GrowthChart` | `components/stats/` | 身長・体重の成長曲線グラフ |

#### 4.3 GrowthChart の仕様（v3.1.1 改訂）

- Recharts の `ComposedChart` を使用
- **2軸グラフ**: 身長と体重を1つのグラフに同時表示
  - Y軸（左）: 身長 (cm)
  - Y軸（右）: 体重 (kg)
- **年齢範囲タブ**: 1歳まで / 2歳まで / 4歳まで / 8歳まで / 12歳まで
  - X軸: 月齢（0〜タブに応じた上限月: 12 / 24 / 48 / 96 / 144）
  - デフォルトは子供の現在月齢に最も近いタブを自動選択
- 自分のデータ: 折れ線 + ドットプロット
  - 身長: 青系の色
  - 体重: 緑系の色
- 標準成長曲線: `Area` コンポーネントで帯表示（3〜97パーセンタイル）
  - 身長帯・体重帯を同時表示（**かなり薄い色**で重ねても視認性を確保）
  - 身長帯: 薄い青、体重帯: 薄い緑
  - データ範囲: 0〜72ヶ月（6歳）まで。8歳・12歳タブでは72ヶ月以降の標準曲線が消える
  - ON/OFF トグル
  - 性別設定済み → デフォルトON
  - 性別未設定 → デフォルトOFF
- 標準成長曲線データ: `src/lib/growth-standards.ts` に静的JSONとして保持

#### 4.4 統計ダッシュボードの再構成（`src/app/(main)/stats/page.tsx`）

統計ページの大元に「記録」「成長」の2タブを設置し、コンテキストを分離する。

- **「記録」タブ**（既存機能をそのまま配置）
  - 期間タブ（週別 / 月別 / 年別）
  - 気分グラフ（MoodChart）
  - カテゴリ円グラフ（CategoryPieChart）
- **「成長」タブ**（新規）
  - 年齢範囲タブ（1歳 / 2歳 / 4歳 / 8歳 / 12歳）
  - 成長曲線グラフ（GrowthChart）
- 子供セレクターは両タブ共通で上部に配置

#### 4.5 子供プロフィールへのコンパクト表示

- 家族画面の各子供プロフィール内に小さな `GrowthChart` を表示
- 直近の身長・体重を数値で表示

### 5. ユーティリティ

#### `src/lib/growth.ts`（新規）

- `fetchGrowthRecords(supabase, childId)`: 成長記録取得
- `addGrowthRecord(supabase, record)`: 成長記録追加
- `updateGrowthRecord(supabase, id, record)`: 成長記録更新
- `deleteGrowthRecord(supabase, id)`: 成長記録削除
- `calcMonthAge(birthDate, measuredDate)`: 月齢計算

### 6. 標準成長曲線データ

#### `src/lib/growth-standards.ts`（新規）

厚生労働省「乳幼児身体発育調査」のデータを静的に保持。

```typescript
export type GrowthStandard = {
  monthAge: number;  // 0〜72
  p3: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p97: number;
};

export const maleHeight: GrowthStandard[] = [...];
export const maleWeight: GrowthStandard[] = [...];
export const femaleHeight: GrowthStandard[] = [...];
export const femaleWeight: GrowthStandard[] = [...];
```

### 7. 影響範囲

- `children` テーブル: `gender` カラム追加（既存データに影響なし）
- `growth_records` テーブル: 新規追加
- `src/types/database.ts`: `children`, `growth_records` 型更新
- `src/types/index.ts`: `GrowthRecord`, `Gender` 型追加
- `src/app/(main)/family/page.tsx`: 子供編集に性別追加、成長記録セクション追加
- `src/app/(main)/stats/page.tsx`: 成長曲線グラフセクション追加
- 新規ファイル: `growth-record-form.tsx`, `growth-record-list.tsx`, `growth-chart.tsx`, `growth.ts`, `growth-standards.ts`, `growth.ts`（schemas）
