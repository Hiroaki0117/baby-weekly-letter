# 設計: 睡眠計測状態の家族間共有

## データベース設計

### `sleep_tracking` テーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 主キー |
| family_id | uuid (FK → families) | 家族ID |
| child_id | uuid (FK → children) | 子供ID（ユニーク制約） |
| started_by | uuid (FK → auth.users) | 開始したユーザーID |
| started_at | timestamptz | 計測開始日時 |
| sleep_date | date | 睡眠日（入力補助用） |
| created_at | timestamptz | レコード作成日時 |

- `child_id` にユニーク制約を付与（同じ子供で複数タイマー不可）
- RLSポリシー: `family_id` が自分の所属家族と一致するレコードのみ SELECT/INSERT/DELETE 可能

### マイグレーションSQL

```sql
CREATE TABLE sleep_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_by uuid NOT NULL REFERENCES auth.users(id),
  started_at timestamptz NOT NULL,
  sleep_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id)
);

ALTER TABLE sleep_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family members can view tracking"
  ON sleep_tracking FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "family members can start tracking"
  ON sleep_tracking FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "family members can stop tracking"
  ON sleep_tracking FOR DELETE
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
```

## コード変更

### 1. `src/types/database.ts`

`sleep_tracking` テーブルの型定義を追加。

### 2. `src/types/index.ts`

`SleepTracking` 型を追加:

```typescript
export type SleepTracking = {
  id: string;
  family_id: string;
  child_id: string;
  started_by: string;
  started_at: string;
  sleep_date: string;
  created_at: string;
};
```

### 3. `src/lib/sleep.ts`

サーバー側の計測状態CRUD関数を追加:

- `fetchActiveTracking(supabase, familyId)` — 家族のアクティブな計測一覧を取得
- `startTracking(supabase, { familyId, childId, startedBy, startedAt, sleepDate })` — 計測開始
- `stopTracking(supabase, trackingId)` — 計測レコードを削除

### 4. `src/components/sleep/quick-sleep-input.tsx`

主な変更:

- **localStorage の廃止**: `getStoredTracking()` / `setStoredTracking()` を削除
- **初期データの受け取り**: props で `activeTracking: SleepTracking[]` を受け取る
- **開始処理**: `handleSleepStart` で `startTracking()` を呼び出し、Supabaseに保存
- **終了処理**: `handleWakeUp` → `handleRecord` で `stopTracking()` + `addSleepRecord()` を呼び出し
- **取消処理**: `stopTracking()` で計測レコードを削除
- **TrackingState の変更**: サーバーから取得した `SleepTracking` をそのまま使用

### 5. `src/app/(main)/family/page.tsx`

- ページ読み込み時に `fetchActiveTracking()` でアクティブな計測を取得
- `QuickSleepInput` に `activeTracking` を props で渡す
- 開始/終了/取消後にリフレッシュ

## フロー

### 開始フロー

1. ユーザーが「開始」ボタンを押す
2. `startTracking()` で `sleep_tracking` にinsert
3. UIに「記録中」を表示
4. 他の家族メンバーがページを開くと `fetchActiveTracking()` で取得 → 「記録中」表示

### 終了フロー

1. 家族の誰かが「終了」ボタンを押す
2. 確認画面で時刻を確認・修正
3. `addSleepRecord()` で `sleep_records` に確定レコードを作成
4. `stopTracking()` で `sleep_tracking` レコードを削除
5. UIを更新

### 取消フロー

1. 「取消」ボタンを押す
2. `stopTracking()` で `sleep_tracking` レコードを削除
3. UIを更新
