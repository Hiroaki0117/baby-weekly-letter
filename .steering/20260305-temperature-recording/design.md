# v3.5 体温記録 - 実装設計

## 1. 実装アプローチ

身長・体重記録（growth_records）の実装パターンを踏襲し、体温専用のテーブル・コンポーネントを新設する。

- **データ**: 体温専用テーブル `temperature_records` を新設（growth_records とは分離）
- **入力UI**: 家族ページの子供プロフィール内に体温セクションを追加。GrowthRecordForm/List と同等のパターン
- **グラフ**: 新コンポーネント `TemperatureChart` を作成。統計ページで成長曲線の下に配置
- **タブ名**: 統計ページのタブ「成長」→「からだの記録」に変更

## 2. データベース設計

### マイグレーション

```sql
-- supabase/migrations/20260305200000_create_temperature_records.sql

CREATE TABLE temperature_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL,
  temperature numeric(3,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temperature_range CHECK (temperature >= 34.0 AND temperature <= 42.0)
);

CREATE INDEX idx_temperature_records_child_measured
  ON temperature_records(child_id, measured_at);

ALTER TABLE temperature_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_temperature ON temperature_records FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);
CREATE POLICY insert_family_temperature ON temperature_records FOR INSERT WITH CHECK (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);
CREATE POLICY update_family_temperature ON temperature_records FOR UPDATE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);
CREATE POLICY delete_family_temperature ON temperature_records FOR DELETE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);
```

**設計判断:**
- `measured_at` は `timestamptz` 型（1日複数回対応。growth_records の `measured_date: date` とは異なる）
- `temperature` は `numeric(3,1)` で小数点1桁（36.5、38.2 など）
- CHECK制約で34.0〜42.0℃の範囲を保証

### 型定義の更新

`src/types/database.ts` に Supabase CLI で再生成。以下の型が追加される想定:

```typescript
// src/types/index.ts に追加
export type TemperatureRecord = Database["public"]["Tables"]["temperature_records"]["Row"];
// => { id: string; child_id: string; measured_at: string; temperature: number; created_at: string; updated_at: string; }

export type TemperatureRecordInsert = Database["public"]["Tables"]["temperature_records"]["Insert"];
```

## 3. ロジック層

### Zodスキーマ

```typescript
// src/schemas/temperature.ts（新規）

export const temperatureRecordSchema = z.object({
  measured_at: z.string().min(1, "計測日時を入力してください"),
  temperature: z
    .number()
    .min(34.0, "34.0℃以上で入力してください")
    .max(42.0, "42.0℃以下で入力してください"),
});

export type TemperatureRecordFormValues = z.infer<typeof temperatureRecordSchema>;
```

### ユーティリティ関数

```typescript
// src/lib/temperature.ts（新規）

// 体温記録を取得（計測日時順）
export async function fetchTemperatureRecords(
  supabase: Client,
  childId: string
): Promise<TemperatureRecord[]>

// 体温記録を追加
export async function addTemperatureRecord(
  supabase: Client,
  record: TemperatureRecordInsert
): Promise<TemperatureRecord>

// 体温記録を更新
export async function updateTemperatureRecord(
  supabase: Client,
  id: string,
  data: { measured_at: string; temperature: number }
): Promise<TemperatureRecord>

// 体温記録を削除
export async function deleteTemperatureRecord(
  supabase: Client,
  id: string
): Promise<void>
```

## 4. コンポーネント設計

### 入力フォーム

```typescript
// src/components/temperature/temperature-record-form.tsx（新規）

type Props = {
  editingRecord?: TemperatureRecord | null;
  onSubmit: (data: { measured_at: string; temperature: number }) => Promise<void>;
  onCancel: () => void;
};
```

**UI仕様:**
- 計測日時: `<input type="datetime-local">` で日時入力（growth は date のみだが、体温は時刻も必要）
- 体温: `<input type="number" step="0.1">` で数値入力、単位「℃」をサフィックス表示
- デフォルト値: 日時は現在時刻、体温は空欄
- GrowthRecordForm と同じデザインパターンを踏襲

### 一覧表示

```typescript
// src/components/temperature/temperature-record-list.tsx（新規）

type Props = {
  records: TemperatureRecord[];
  onEdit: (record: TemperatureRecord) => void;
  onDelete: (id: string) => void;
};
```

**UI仕様:**
- 新しい順に表示
- 各レコード: 日時（yyyy/M/d HH:mm）+ 体温（XX.X℃）
- 37.5℃以上の場合は体温テキストを赤系の色で強調表示
- 編集・削除アイコン（GrowthRecordList と同じパターン）

### 体温グラフ

```typescript
// src/components/stats/temperature-chart.tsx（新規）

type Props = {
  records: TemperatureRecord[];
};
```

**UI仕様:**
- Recharts の `LineChart` で折れ線グラフ
- 横軸: 日時（`M/d HH:mm` 形式）
- 縦軸: 体温（℃）、範囲は 35.0〜40.0 程度（データに応じて自動調整）
- 37.5℃に参考ライン（`ReferenceLine`）を破線で表示、ラベル「37.5℃」
- 期間切替タブ: 1週間 / 2週間 / 1ヶ月
- データポイントにドットを表示、ホバーで日時・体温をツールチップ表示
- 線の色: オレンジ系（`#fb923c`）— 身長の青・体重の緑と区別

## 5. ページ側のデータフロー

### 家族ページ（`src/app/(main)/family/page.tsx`）

1. 既存の成長記録セクションの下に体温記録セクションを追加
2. state: `temperatureMap: Record<string, TemperatureRecord[]>`
3. 初回ロード時に全子供の体温記録を取得
4. CRUD操作: addTemperatureRecord / updateTemperatureRecord / deleteTemperatureRecord を呼び出し

### 統計ページ（`src/app/(main)/stats/page.tsx`）

1. タブラベル変更: `{ key: "growth", label: "成長" }` → `{ key: "growth", label: "からだの記録" }`
2. 成長タブ内に TemperatureChart を GrowthChart の下に配置
3. state: `temperatureMap: Record<string, TemperatureRecord[]>`
4. 選択中の子供の体温記録を TemperatureChart に渡す

## 6. テスト

### スキーマテスト

```
__tests__/schemas/temperature.test.ts（新規）
```

- 正常値（36.5℃など）のバリデーション通過
- 範囲外（33.9℃、42.1℃）のバリデーションエラー
- 必須項目欠落のエラー

### ユーティリティテスト

既存の growth.test.ts パターンに倣い、必要に応じて追加。

## 7. 影響範囲

### 新規ファイル

| ファイル | 内容 |
|----------|------|
| `supabase/migrations/20260305200000_create_temperature_records.sql` | テーブル作成 |
| `src/schemas/temperature.ts` | Zodスキーマ |
| `src/lib/temperature.ts` | CRUD関数 |
| `src/components/temperature/temperature-record-form.tsx` | 入力フォーム |
| `src/components/temperature/temperature-record-list.tsx` | 一覧表示 |
| `src/components/stats/temperature-chart.tsx` | 体温グラフ |
| `__tests__/schemas/temperature.test.ts` | スキーマテスト |

### 変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/types/database.ts` | Supabase CLI で再生成（temperature_records 追加） |
| `src/types/index.ts` | TemperatureRecord / TemperatureRecordInsert 型の export 追加 |
| `src/app/(main)/family/page.tsx` | 体温記録セクション追加（state, fetch, CRUD, UI） |
| `src/app/(main)/stats/page.tsx` | タブ名変更「成長」→「からだの記録」、TemperatureChart 追加 |

## 8. 永続的ドキュメント更新

- `docs/product-requirements.md`: v3.5 の状態を更新（実装完了時）
- `docs/functional-design.md`: temperature_records テーブル定義、体温記録の画面仕様を追加
