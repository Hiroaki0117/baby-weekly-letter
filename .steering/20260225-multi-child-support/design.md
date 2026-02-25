# 複数子供対応 - 設計書

## 1. データベース変更

### 1.1 マイグレーション方針

段階的に移行する（既存データを壊さない）：

1. `child_id` カラムを **nullable** で追加
2. 既存データに最初の子供のIDを割り当て
3. `child_id` を **NOT NULL** に変更

### 1.2 マイグレーションSQL

```sql
-- Step 1: daily_logs に child_id を追加（nullable）
ALTER TABLE daily_logs ADD COLUMN child_id uuid REFERENCES children(id);
CREATE INDEX idx_daily_logs_child ON daily_logs(child_id);

-- Step 2: weekly_reports に child_id を追加（nullable）
ALTER TABLE weekly_reports ADD COLUMN child_id uuid REFERENCES children(id);
DROP INDEX IF EXISTS weekly_reports_family_id_week_start_key;
CREATE UNIQUE INDEX weekly_reports_family_child_week
  ON weekly_reports(family_id, child_id, week_start);

-- Step 3: monthly_reports に child_id を追加（nullable）
ALTER TABLE monthly_reports ADD COLUMN child_id uuid REFERENCES children(id);
DROP INDEX IF EXISTS monthly_reports_family_id_month_key;
CREATE UNIQUE INDEX monthly_reports_family_child_month
  ON monthly_reports(family_id, child_id, month);

-- Step 4: 既存データに最初の子供を割り当て
UPDATE daily_logs
SET child_id = (
  SELECT id FROM children
  WHERE children.family_id = daily_logs.family_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE child_id IS NULL;

UPDATE weekly_reports
SET child_id = (
  SELECT id FROM children
  WHERE children.family_id = weekly_reports.family_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE child_id IS NULL;

UPDATE monthly_reports
SET child_id = (
  SELECT id FROM children
  WHERE children.family_id = monthly_reports.family_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE child_id IS NULL;

-- Step 5: NOT NULL制約を追加
ALTER TABLE daily_logs ALTER COLUMN child_id SET NOT NULL;
ALTER TABLE weekly_reports ALTER COLUMN child_id SET NOT NULL;
ALTER TABLE monthly_reports ALTER COLUMN child_id SET NOT NULL;
```

### 1.3 TypeScript型の更新

`src/types/database.ts` の変更箇所：

```typescript
// daily_logs.Row に追加
child_id: string;

// daily_logs.Insert に追加
child_id: string;

// daily_logs.Update に追加
child_id?: string;

// weekly_reports.Row / Insert / Update に同様に追加
// monthly_reports.Row / Insert / Update に同様に追加
```

## 2. 画面別設計

### 2.1 今日ページ (`src/app/(main)/page.tsx`)

**変更内容：**
- 子供データの取得: `.limit(1).maybeSingle()` → `.select("*").order("created_at")` で全件取得
- 状態: `childName` / `birthDate` → `children: Child[]` に変更
- 月齢表示: 子供の数だけループして表示

**表示イメージ：**
```
Today
2026年2月25日（火）
────────────────────
🍼 太郎・1歳2ヶ月3日
🍼 花子・0歳5ヶ月10日
📝 今日は3件の記録があります
🔥 5日連続記録中！
```

**子供が1人の場合：** 現状と同じ表示（変更なし）

### 2.2 記録フォーム (`src/components/log/log-form.tsx`)

**変更内容：**
- 新しいprop: `children: Child[]` を受け取る
- フォームスキーマに `child_id: string` を追加
- 子供が2人以上 → フォーム上部に子供セレクタを表示
- 子供が1人 → セレクタ非表示、自動で `child_id` をセット
- insert/update 時に `child_id` を含める

**子供セレクタUI：**
```
┌─────────────────────────────┐
│ 今日の記録                    │
├─────────────────────────────┤
│ 👶 だれのきろく？              │
│ [太郎]  [花子]    ← トグル   │
├─────────────────────────────┤
│ 今日の気分                    │
│ ...                          │
```

- 記録一覧/カレンダーの編集時も同様にセレクタが表示される
- LogFormを使う側（page.tsx, calendar/page.tsx）で `children` を渡す

### 2.3 記録カード (`src/components/log/log-card.tsx`)

**変更内容：**
- 新しいprop: `childName?: string | null` を追加
- 日付・著者の横に子供名バッジを表示

**表示イメージ：**
```
😊 2月25日（火）  [ママ]  [太郎]
    いい日
  今日は公園で遊びました...
```

- 子供が1人の場合でもバッジを表示（統一性のため）
- バッジの色はプライマリカラー系で著者バッジと差別化

### 2.4 記録一覧ページ (`src/app/(main)/logs/page.tsx`)

**変更内容：**
- 子供データを取得してフィルターに渡す
- LogCardに `childName` を渡す

### 2.5 記録フィルター (`src/components/log/log-filter.tsx`)

**変更内容：**
- 新しいprop: `children: Child[]`, `selectedChildIds: string[]`, `onChildIdsChange`
- 子供が2人以上の場合のみ、子供フィルターセクションを表示
- 気分フィルターと同様のトグルボタン形式

**表示イメージ：**
```
🔍 検索...
👶 太郎  花子           ← 子供フィルター（2人以上で表示）
😊😐😴                  ← 気分フィルター
食事 睡眠 遊び ...       ← カテゴリフィルター
```

### 2.6 カレンダーページ (`src/app/(main)/calendar/page.tsx`)

**変更内容：**
- 子供データを取得
- LogCardに `childName` を渡す
- 編集時にLogFormへ `children` を渡す

### 2.7 通信ページ (`src/app/(main)/weekly/page.tsx`)

**変更内容：**
- 子供データを取得
- 子供が2人以上 → タブUIで子供を切り替え
- 子供が1人 → タブ非表示（現状と同じ）
- 選択中の子供の `child_id` で通信をフィルター
- 生成ボタンも選択中の子供に紐づく

**タブUI：**
```
週次通信 / 月次まとめ
[太郎]  [花子]           ← 子供タブ（2人以上で表示）
──────────────────────
2/17 - 2/23 の週次通信
2/10 - 2/16 の週次通信
```

### 2.8 通信詳細ページ (`src/app/(main)/weekly/[id]/page.tsx`)

**変更内容：**
- 通信データに子供名を表示（ヘッダー部分）

### 2.9 週次通信生成API (`src/app/api/weekly-report/generate/route.ts`)

**変更内容：**
- リクエストに `childId` パラメータを追加
- 指定された `child_id` のログのみ取得
- 該当子供の情報をプロンプトに渡す
- `weekly_reports` に `child_id` を含めて保存
- ユニーク制約: `(family_id, child_id, week_start)`

### 2.10 月次まとめ生成API (`src/app/api/monthly-report/generate/route.ts`)

**変更内容：**
- リクエストに `childId` パラメータを追加
- 指定された `child_id` の週次通信のみ取得
- 該当子供の情報をプロンプトに渡す
- `monthly_reports` に `child_id` を含めて保存
- ユニーク制約: `(family_id, child_id, month)`

### 2.11 AI プロンプト (`src/lib/weekly-report/prompt.ts`, `src/lib/monthly-report/prompt.ts`)

**変更内容：**
- 子供情報の渡し方は現状と同じ（名前・月齢）
- 呼び出し元で対象の子供を特定してから渡すので、プロンプト自体の変更は最小限

### 2.12 家族ページ (`src/app/(main)/family/page.tsx`)

**変更内容：**
- 子供を全件取得して一覧表示
- 各子供に「編集」機能（名前・生年月日）
- 「＋ 子供を追加」ボタン
- 子供の追加フォーム（名前 + 生年月日）

**表示イメージ：**
```
家族
──────────────────
👨‍👩‍👧‍👦 メンバー
  ママ（オーナー）
  パパ

👶 お子さま
  太郎  2024/12/22  1歳2ヶ月  [編集]
  花子  2025/09/15  0歳5ヶ月  [編集]
  [＋ お子さまを追加]

🔗 招待リンク
  ...
```

### 2.13 オンボーディング (`src/app/(auth)/onboarding/page.tsx`)

**変更内容：**
- Step 3 を複数子供対応に
- 状態: `childName` / `childBirthDate` → `children: { name: string; birthDate: string }[]`
- 「＋ もう1人追加」ボタン
- 各子供の横に「✕」削除ボタン（最低1人は残す）
- APIへの送信: `children` 配列を渡す

**表示イメージ：**
```
Step 3: お子さまの情報
  1人目
  名前: [太郎        ]
  生年月日: [2024-12-22]

  2人目
  名前: [花子        ]
  生年月日: [2025-09-15]  [✕]

  [＋ もう1人追加]

  [完了]
```

### 2.14 家族作成API (`src/app/api/family/create/route.ts`)

**変更内容：**
- リクエストパラメータ: `childName` / `childBirthDate` → `children: { name?: string; birthDate?: string }[]`
- 複数子供をループで `children` テーブルに insert
- 後方互換: 旧パラメータ（`childName`）が来ても動作するようにする

### 2.15 バリデーションスキーマ (`src/schemas/family.ts`)

**変更内容：**
```typescript
// 現状
childName: z.string().max(50).optional(),
childBirthDate: z.string().optional(),

// 変更後
children: z.array(z.object({
  name: z.string().max(50).optional(),
  birthDate: z.string().optional(),
})).min(1),
```

## 3. 共通コンポーネント

### 3.1 子供セレクタ (`src/components/child/child-selector.tsx`) [新規]

記録フォームで使う子供選択UI。

```typescript
type ChildSelectorProps = {
  children: Child[];
  selectedId: string;
  onChange: (childId: string) => void;
};
```

- 気分セレクタと同様のトグルボタンスタイル
- 子供が1人の場合はレンダリングしない（呼び出し元で制御）

### 3.2 子供バッジ (`src/components/child/child-badge.tsx`) [新規]

記録カードで子供名を表示するバッジ。

```typescript
type ChildBadgeProps = {
  name: string;
};
```

- 著者バッジ（AuthorBadge）と並べて表示
- プライマリカラー系でスタイリング

## 4. データフロー

### 4.1 記録の作成フロー

```
ユーザーがフォーム入力
  ↓
子供セレクタで対象の子供を選択（1人の場合は自動）
  ↓
daily_logs に insert（child_id を含む）
  ↓
記録一覧/カレンダーに反映
```

### 4.2 通信の生成フロー

```
通信ページで子供タブを選択
  ↓
「生成」ボタン押下
  ↓
API に childId を送信
  ↓
該当 child_id の daily_logs を取得
  ↓
子供の名前・月齢をプロンプトに含めて生成
  ↓
weekly_reports に child_id 付きで保存
```

## 5. 影響範囲まとめ

### 新規ファイル
| ファイル | 説明 |
|---------|------|
| `supabase/migrations/20260225000000_add_child_id.sql` | child_id追加マイグレーション |
| `src/components/child/child-selector.tsx` | 子供セレクタコンポーネント |
| `src/components/child/child-badge.tsx` | 子供名バッジコンポーネント |

### 変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/types/database.ts` | daily_logs, weekly_reports, monthly_reports に child_id 追加 |
| `src/schemas/family.ts` | children 配列スキーマに変更 |
| `src/app/(main)/page.tsx` | 複数子供の月齢表示 |
| `src/components/log/log-form.tsx` | child_id 対応、子供セレクタ統合 |
| `src/components/log/log-card.tsx` | 子供名バッジ表示 |
| `src/components/log/log-filter.tsx` | 子供フィルター追加 |
| `src/app/(main)/logs/page.tsx` | 子供データ取得、フィルター連携 |
| `src/app/(main)/calendar/page.tsx` | 子供データ取得、LogForm/LogCard連携 |
| `src/app/(main)/weekly/page.tsx` | 子供タブUI、child_id フィルター |
| `src/app/(main)/weekly/[id]/page.tsx` | 子供名表示 |
| `src/app/(main)/weekly/monthly/[id]/page.tsx` | 子供名表示 |
| `src/app/(main)/family/page.tsx` | 複数子供の一覧・追加・編集 |
| `src/app/(auth)/onboarding/page.tsx` | 複数子供登録UI |
| `src/app/api/family/create/route.ts` | 複数子供の一括登録 |
| `src/app/api/weekly-report/generate/route.ts` | childId パラメータ対応 |
| `src/app/api/monthly-report/generate/route.ts` | childId パラメータ対応 |
| `src/lib/weekly-report/generate.ts` | child_id フィルター |
| `src/lib/monthly-report/generate.ts` | child_id フィルター |

## 6. 後方互換性

- 子供が1人のユーザーは UI 変更を最小限に抑える（セレクタ非表示、タブ非表示）
- 既存データは最初の子供に自動割り当て
- マイグレーションは nullable → データ埋め → NOT NULL の段階的実行
- 家族作成APIは旧パラメータ（`childName`）もフォールバックとして受け付ける
