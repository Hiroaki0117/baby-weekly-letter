# 家族間リアクション機能 - 設計書

## 1. データモデル

### 1.1 新規テーブル: `log_reactions`

| カラム | 型 | 制約 | 備考 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| log_id | uuid | FK → daily_logs(id) ON DELETE CASCADE, NOT NULL | リアクション対象のログ |
| user_id | uuid | FK → auth.users(id), NOT NULL | リアクションしたユーザー |
| emoji | text | NOT NULL | スタンプ種別（heart / clap / smile / muscle / sparkle） |
| created_at | timestamptz | DEFAULT now() | |

**制約:**
- UNIQUE(log_id, user_id, emoji) — 同一ユーザーが同一ログに同じスタンプは1回のみ

**インデックス:**
- `idx_log_reactions_log_id` ON log_reactions(log_id) — ログ単位のリアクション取得用

### 1.2 スタンプ定義（アプリ側定数）

```typescript
const REACTION_STAMPS = [
  { key: "heart", emoji: "❤️", label: "いいね" },
  { key: "clap", emoji: "👏", label: "すごい！" },
  { key: "smile", emoji: "😊", label: "ほっこり" },
  { key: "muscle", emoji: "💪", label: "おつかれさま" },
  { key: "sparkle", emoji: "✨", label: "キラキラ" },
] as const;
```

### 1.3 RLS ポリシー

| 操作 | ポリシー |
|------|----------|
| SELECT | `log_id` のログが自分の家族に属する（daily_logs.family_id = my_family_id()） |
| INSERT | `user_id = auth.uid()` かつ対象ログが自分の家族に属する |
| DELETE | `user_id = auth.uid()`（自分のリアクションのみ取り消し可） |

UPDATE は不要（トグル式＝INSERT/DELETE で表現）。

## 2. TypeScript 型定義

`src/types/database.ts` に `log_reactions` テーブルの型を追加。

`src/types/index.ts` に以下を追加:

```typescript
export type LogReaction = Database["public"]["Tables"]["log_reactions"]["Row"];

// ログに紐づくリアクション集計（フロント表示用）
export type ReactionSummary = {
  emoji: string;       // "heart" | "clap" | ...
  count: number;       // 合計件数
  reacted: boolean;    // 自分が押しているか
};
```

## 3. API設計

リアクションの送信・取り消しは Supabase クライアントで直接操作する（Route Handler 不要）。

### 3.1 リアクション取得

```typescript
// ログIDの配列に対するリアクションを一括取得
const { data } = await supabase
  .from("log_reactions")
  .select("log_id, user_id, emoji")
  .in("log_id", logIds);
```

### 3.2 リアクション送信（INSERT）

```typescript
await supabase
  .from("log_reactions")
  .insert({ log_id, user_id, emoji });
```

### 3.3 リアクション取り消し（DELETE）

```typescript
await supabase
  .from("log_reactions")
  .delete()
  .eq("log_id", log_id)
  .eq("user_id", user_id)
  .eq("emoji", emoji);
```

## 4. コンポーネント設計

### 4.1 新規コンポーネント

#### `ReactionBar`（`src/components/log/reaction-bar.tsx`）

ログカード下部に表示するリアクションUI。

**Props:**
```typescript
type ReactionBarProps = {
  logId: string;
  reactions: ReactionSummary[];
  onToggle: (logId: string, emoji: string) => void;
};
```

**表示:**
- リアクション済みスタンプ: 絵文字 + 件数をボタンとして表示
- 自分が押したスタンプはハイライト（背景色 `bg-primary/15`、ボーダー `border-primary/40`）
- 未リアクションのスタンプ: 薄いグレーで表示
- スタンプを押すと `onToggle` でトグル

**レイアウト（モバイル）:**
```
[❤️ 2] [👏 1] [😊] [💪] [✨]
```
- 件数がある（1以上の）スタンプは件数付き
- 件数0のスタンプは絵文字のみ（小さめに表示）

#### `ReactionNotice`（`src/components/home/reaction-notice.tsx`）

ホーム画面に表示する新着リアクション通知。

**Props:**
```typescript
type ReactionNoticeProps = {
  count: number;        // 新着リアクション件数
  onTap: () => void;    // タップ時のアクション
};
```

**表示:**
```
❤️ ○件の新しいリアクション
```

**通知の仕組み:**
- `localStorage` に `lastReactionCheckedAt`（最終確認日時）を保存
- ページ表示時に、自分が author のログへのリアクションで `created_at > lastReactionCheckedAt` のものをカウント
- タップすると `lastReactionCheckedAt` を現在日時に更新し、ログ一覧ページ（`/logs`）に遷移

### 4.2 既存コンポーネントの変更

#### `LogCard`（`src/components/log/log-card.tsx`）

- カテゴリバッジの下に `ReactionBar` を追加
- `reactions` と `onToggle` をpropsに追加

#### ホーム画面（`src/app/(main)/page.tsx`）

- 日付ヘッダーの下（MemoriesSectionの上）に `ReactionNotice` を追加
- ログ取得時にリアクションも一括取得
- `onToggle` ハンドラーで INSERT/DELETE を実行し、state を即座に更新（楽観的更新）

#### ログ一覧画面（`src/app/(main)/logs/page.tsx`）

- ログ取得時にリアクションも一括取得
- `LogCard` に `reactions` と `onToggle` を渡す

## 5. リアクション取得・集計ロジック

`src/lib/reactions.ts` に集約:

```typescript
// リアクション一括取得 → ログID別のReactionSummary[]に変換
export function buildReactionMap(
  rawReactions: { log_id: string; user_id: string; emoji: string }[],
  currentUserId: string
): Record<string, ReactionSummary[]>

// リアクショントグル（INSERT or DELETE）
export async function toggleReaction(
  supabase: SupabaseClient,
  logId: string,
  userId: string,
  emoji: string,
  currentlyReacted: boolean
): Promise<void>
```

## 6. マイグレーション

ファイル名: `supabase/migrations/20260226100000_add_log_reactions.sql`

```sql
CREATE TABLE log_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(log_id, user_id, emoji)
);

CREATE INDEX idx_log_reactions_log_id ON log_reactions(log_id);

ALTER TABLE log_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_reactions ON log_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_reactions.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

CREATE POLICY insert_own_reaction ON log_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_reactions.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

CREATE POLICY delete_own_reaction ON log_reactions
  FOR DELETE USING (user_id = auth.uid());
```

## 7. 影響範囲

### 新規ファイル
- `supabase/migrations/20260226100000_add_log_reactions.sql`
- `src/components/log/reaction-bar.tsx`
- `src/components/home/reaction-notice.tsx`
- `src/lib/reactions.ts`

### 変更ファイル
- `src/types/database.ts` — log_reactions テーブル型追加
- `src/types/index.ts` — LogReaction, ReactionSummary 型追加
- `src/components/log/log-card.tsx` — ReactionBar 組み込み
- `src/app/(main)/page.tsx` — リアクション取得・通知表示
- `src/app/(main)/logs/page.tsx` — リアクション取得・トグル
