# 設計: 睡眠統計に日中/夜間の区分表示を追加

## 実装アプローチ

`sleep_records` テーブルに `sleep_category` カラム（`night` / `daytime`）を追加し、登録・更新時に `started_at` の JST 時刻から自動判定して保存する。統計チャートは保存済みの値を参照して積み上げ棒グラフで表示する。

## 変更するファイル

### 1. DB マイグレーション（新規）

**`supabase/migrations/20260311120000_add_sleep_category.sql`**

```sql
-- sleep_category カラム追加（既存レコードをバックフィルしてから NOT NULL にする）
ALTER TABLE sleep_records
  ADD COLUMN sleep_category text;

-- 既存レコードのバックフィル（started_at を JST に変換して時刻で判定）
UPDATE sleep_records
SET sleep_category = CASE
  WHEN EXTRACT(HOUR FROM started_at AT TIME ZONE 'Asia/Tokyo') >= 19
    OR EXTRACT(HOUR FROM started_at AT TIME ZONE 'Asia/Tokyo') < 6
  THEN 'night'
  ELSE 'daytime'
END;

-- NOT NULL 制約を追加
ALTER TABLE sleep_records
  ALTER COLUMN sleep_category SET NOT NULL;

-- CHECK 制約
ALTER TABLE sleep_records
  ADD CONSTRAINT sleep_category_check CHECK (sleep_category IN ('night', 'daytime'));
```

### 2. DB 型定義の更新

**`src/types/database.ts`** — `sleep_records` の Row / Insert / Update に `sleep_category: string` を追加。

### 3. ドメイン型の追加

**`src/types/index.ts`**

```typescript
export type SleepCategory = "night" | "daytime";

export const SLEEP_CATEGORY_OPTIONS: { value: SleepCategory; label: string }[] = [
  { value: "night", label: "夜間睡眠" },
  { value: "daytime", label: "日中睡眠" },
];
```

### 4. 判定ロジック

**`src/lib/sleep.ts`** に関数を追加:

```typescript
/**
 * 開始時刻（ISO 8601）から睡眠区分を判定する。
 * JST（UTC+9）の時刻で 19:00〜翌5:59 を夜間、6:00〜18:59 を日中とする。
 */
export function classifySleep(startedAt: string): SleepCategory {
  const d = new Date(startedAt);
  // JST = UTC + 9 時間
  const jstHour = (d.getUTCHours() + 9) % 24;
  return jstHour >= 19 || jstHour < 6 ? "night" : "daytime";
}
```

### 5. 登録・更新時の適用箇所

`addSleepRecord` を呼ぶ全箇所で `sleep_category` を付与する。

| 呼び出し元 | 関数 |
|---|---|
| `src/components/sleep/quick-sleep-input.tsx` | `handleRecord()`, `handleManualRecord()` |
| `src/app/(main)/family/page.tsx` | `handleAddSleep()`, `handleUpdateSleep()` |

各箇所で `buildTimestamps` → `classifySleep(startedAt)` → `sleep_category` をセットする。

### 6. 統計チャートの変更

**`src/components/stats/sleep-chart.tsx`**

- `ChartDataPoint` を `night` / `daytime` の2フィールドに変更
- 積み上げ棒グラフ（`stackId` 使用）で夜間・日中を色分け表示
  - 夜間: indigo-400（`#818cf8`）— 既存色を継承
  - 日中: amber-400（`#fbbf24`）
- ツールチップで夜間・日中それぞれの時間を表示
- 凡例を追加

### 7. 家族ページの記録一覧表示

**`src/components/sleep/sleep-record-list.tsx`**

- 各レコードに「夜間」「日中」のラベルを小さく表示（任意、必須ではない）

## データフロー

```
入力（時刻） → buildTimestamps() → classifySleep(startedAt) → sleep_category
    ↓
addSleepRecord({ ..., sleep_category })
    ↓
DB 保存 (sleep_records.sleep_category = 'night' | 'daytime')
    ↓
fetchSleepRecords() → SleepChart で record.sleep_category を参照して集計・表示
```

## 影響範囲

| 領域 | 影響 |
|---|---|
| DB スキーマ | `sleep_category` カラム追加 + 既存レコードのバックフィル |
| 型定義 | `database.ts`, `index.ts` に型追加 |
| ロジック | `sleep.ts` に `classifySleep` 追加 |
| 登録処理 | quick-sleep-input, family page の add/update 4箇所 |
| 統計表示 | sleep-chart を積み上げ棒グラフに変更 |
| 記録一覧 | sleep-record-list にラベル追加（任意） |
| テスト | `classifySleep` のユニットテスト追加 |

## テスト方針

`__tests__/lib/sleep.test.ts` に `classifySleep` のテストケースを追加:

- 6:00 (JST) → `daytime`
- 18:59 (JST) → `daytime`
- 19:00 (JST) → `night`
- 5:59 (JST) → `night`
- 0:00 (JST) → `night`
- 12:00 (JST) → `daytime`
