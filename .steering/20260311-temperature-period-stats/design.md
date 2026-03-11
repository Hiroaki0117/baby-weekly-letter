# 設計: 体温記録に時間区分を追加し、統計をグリッド表示に変更

## 実装アプローチ

`temperature_records` テーブルに `temp_period` カラム（`morning` / `afternoon` / `evening` / `night`）を追加し、登録・更新時に `measured_at` の JST 時刻から自動判定して保存する。統計チャートは日×時間区分のグリッド表示に変更し、セルに体温数値を色分けで表示する。

## 変更するファイル

### 1. DB マイグレーション（新規）

**`supabase/migrations/20260311130000_add_temp_period.sql`**

```sql
-- temp_period カラム追加
ALTER TABLE temperature_records
  ADD COLUMN temp_period text;

-- 既存レコードのバックフィル（measured_at を JST に変換して時刻で判定）
UPDATE temperature_records
SET temp_period = CASE
  WHEN EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') >= 5
    AND EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') < 10
  THEN 'morning'
  WHEN EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') >= 10
    AND EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') < 16
  THEN 'afternoon'
  WHEN EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') >= 16
    AND EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') < 20
  THEN 'evening'
  ELSE 'night'
END;

-- NOT NULL 制約を追加
ALTER TABLE temperature_records
  ALTER COLUMN temp_period SET NOT NULL;

-- CHECK 制約
ALTER TABLE temperature_records
  ADD CONSTRAINT temp_period_check CHECK (temp_period IN ('morning', 'afternoon', 'evening', 'night'));
```

### 2. DB 型定義の更新

**`src/types/database.ts`** — `temperature_records` の Row / Insert / Update に `temp_period: string` を追加。

### 3. ドメイン型の追加

**`src/types/index.ts`**

```typescript
export type TempPeriod = "morning" | "afternoon" | "evening" | "night";

export const TEMP_PERIOD_OPTIONS: { value: TempPeriod; label: string }[] = [
  { value: "morning", label: "朝" },
  { value: "afternoon", label: "昼" },
  { value: "evening", label: "夕" },
  { value: "night", label: "夜" },
];
```

### 4. 判定ロジック

**`src/lib/temperature.ts`** に関数を追加:

```typescript
/**
 * 計測時刻（ISO 8601）から時間区分を判定する。
 * JST（UTC+9）で判定:
 *   朝 (morning):  5:00〜9:59
 *   昼 (afternoon): 10:00〜15:59
 *   夕 (evening):  16:00〜19:59
 *   夜 (night):    20:00〜翌4:59
 */
export function classifyTempPeriod(measuredAt: string): TempPeriod {
  const d = new Date(measuredAt);
  const jstHour = (d.getUTCHours() + 9) % 24;
  if (jstHour >= 5 && jstHour < 10) return "morning";
  if (jstHour >= 10 && jstHour < 16) return "afternoon";
  if (jstHour >= 16 && jstHour < 20) return "evening";
  return "night";
}
```

### 5. 登録・更新時の適用箇所

`addTemperatureRecord` を呼ぶ全箇所で `temp_period` を付与する。

| 呼び出し元 | 関数 |
|---|---|
| `src/components/temperature/quick-temperature-input.tsx` | `handleRecord()` |
| `src/app/(main)/family/page.tsx` | `handleAddTemp()`, `handleUpdateTemp()` |

### 6. 統計チャートの変更

**`src/components/stats/temperature-chart.tsx`**

食事・睡眠チャートと同様のグリッド表示に変更:

- ヘッダー: 日付 / 朝 / 昼 / 夕 / 夜
- セルに体温数値を表示
- 色分け:
  - 37.5℃以上: 赤系（`bg-red-100 text-red-700`）— 発熱
  - 37.0〜37.4℃: 黄系（`bg-yellow-100 text-yellow-700`）— やや高め
  - 36.0〜36.9℃: 緑系（`bg-green-100 text-green-700`）— 平熱
  - 36.0℃未満: 青系（`bg-blue-100 text-blue-700`）— 低め
- 同一区分に複数記録がある場合:
  - セルには最新の1件を表示
  - ホバー/タップで全件をポップオーバーで表示（時刻と体温）
- 未記録のセルは「ー」表示

### 7. updateTemperatureRecord の引数型拡張

**`src/lib/temperature.ts`** — `updateTemperatureRecord` の `record` 引数に `temp_period?: string` を追加。

## データフロー

```
入力（計測時刻） → classifyTempPeriod(measuredAt) → temp_period
    ↓
addTemperatureRecord({ ..., temp_period })
    ↓
DB 保存 (temperature_records.temp_period = 'morning' | 'afternoon' | 'evening' | 'night')
    ↓
fetchTemperatureRecords() → TemperatureChart で record.temp_period を参照してグリッド表示
```

## 影響範囲

| 領域 | 影響 |
|---|---|
| DB スキーマ | `temp_period` カラム追加 + 既存レコードのバックフィル |
| 型定義 | `database.ts`, `index.ts` に型追加 |
| ロジック | `temperature.ts` に `classifyTempPeriod` 追加 |
| 登録処理 | quick-temperature-input, family page の add/update 3箇所 |
| 統計表示 | temperature-chart を折れ線グラフからグリッド表示に変更 |
| テスト | `classifyTempPeriod` のユニットテスト追加 |

## テスト方針

`__tests__/lib/temperature.test.ts`（新規）に `classifyTempPeriod` のテストケースを追加:

- 5:00 (JST) → `morning`
- 9:59 (JST) → `morning`
- 10:00 (JST) → `afternoon`
- 15:59 (JST) → `afternoon`
- 16:00 (JST) → `evening`
- 19:59 (JST) → `evening`
- 20:00 (JST) → `night`
- 4:59 (JST) → `night`
- 0:00 (JST) → `night`
