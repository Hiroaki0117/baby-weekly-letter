# v3.4 家族コメント機能 - 設計書

## 1. 実装アプローチ

既存のリアクション機能と同じアーキテクチャパターン（DB直接操作 + 楽観的UI + nameMap）を踏襲し、コメント機能を追加する。

## 2. データベース設計

### 2.1 マイグレーション

`supabase/migrations/20260305100000_add_log_comments.sql`

```sql
CREATE TABLE log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT log_comments_text_length CHECK (char_length(text) <= 100),
  CONSTRAINT log_comments_text_not_empty CHECK (char_length(trim(text)) > 0)
);

CREATE INDEX idx_log_comments_log_id ON log_comments(log_id);

ALTER TABLE log_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: 家族スコープ
CREATE POLICY select_family_comments ON log_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_comments.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

-- INSERT: 自分のコメントのみ追加可（家族スコープ）
CREATE POLICY insert_own_comment ON log_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_comments.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

-- UPDATE: 自分のコメントのみ編集可
CREATE POLICY update_own_comment ON log_comments
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE: 自分のコメントのみ削除可
CREATE POLICY delete_own_comment ON log_comments
  FOR DELETE USING (user_id = auth.uid());

-- updated_at トリガー
CREATE TRIGGER log_comments_updated_at
  BEFORE UPDATE ON log_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.2 型定義

`src/types/database.ts` に Supabase CLI で自動生成。
`src/types/index.ts` にエイリアスを追加：

```typescript
export type LogComment = Database["public"]["Tables"]["log_comments"]["Row"];
export type LogCommentInsert = Database["public"]["Tables"]["log_comments"]["Insert"];
```

## 3. ロジック層

### 3.1 `src/lib/comments.ts`（新規）

リアクション（`src/lib/reactions.ts`）と同じパターンで実装。

```typescript
// 型定義
export type CommentEntry = {
  id: string;
  logId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

// ログID別のコメントマップ構築
export function buildCommentMap(
  rawComments: RawComment[]
): Record<string, CommentEntry[]>

// コメント追加
export async function addComment(
  supabase, logId, userId, text
): Promise<LogComment>

// コメント更新
export async function updateComment(
  supabase, commentId, text
): Promise<void>

// コメント削除
export async function deleteComment(
  supabase, commentId
): Promise<void>
```

### 3.2 Zodスキーマ `src/schemas/comment.ts`（新規）

```typescript
export const commentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "コメントを入力してください")
    .max(100, "100文字以内で入力してください"),
});
```

## 4. コンポーネント設計

### 4.1 変更するコンポーネント

| コンポーネント | 変更内容 |
|---------------|---------|
| `log-card.tsx` | コメントセクションを ReactionBar の下に追加 |
| `reaction-notice.tsx` | コメント新着数も含めた通知表示に変更 |

### 4.2 新規コンポーネント

#### `src/components/log/comment-section.tsx`

コメント一覧 + 入力欄をまとめたコンポーネント。

```
Props:
  logId: string
  comments: CommentEntry[]
  currentUserId: string
  nameMap: Record<string, string>
  onAdd: (logId: string, text: string) => void
  onUpdate: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
```

**レイアウト：**

```
┌─────────────────────────────────┐
│ コメント一覧（昇順）              │
│  太郎: すごい！         [・・・] │  ← 自分のみ編集/削除メニュー
│  花子: がんばったね！    12:30   │
│                                 │
│ [コメントを入力...        ] [送信] │
└─────────────────────────────────┘
```

#### `src/components/log/comment-item.tsx`

個別コメントの表示。自分のコメントには編集/削除の操作メニュー（ドロップダウン）を表示。

```
Props:
  comment: CommentEntry
  authorName: string
  isOwn: boolean
  onUpdate: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
```

**表示状態：**
- 通常: 表示名 + テキスト + 時刻
- 編集中: テキスト入力欄に切り替え + 保存/キャンセルボタン

## 5. ページ側のデータフロー

### 5.1 `src/app/(main)/logs/page.tsx`

既存のリアクションと同じパターンで並行取得：

```typescript
// 既存: reactions取得
const { data: reactionsData } = await supabase
  .from("log_reactions")
  .select("log_id, user_id, emoji")
  .in("log_id", logIds);

// 追加: comments取得
const { data: commentsData } = await supabase
  .from("log_comments")
  .select("id, log_id, user_id, text, created_at, updated_at")
  .in("log_id", logIds)
  .order("created_at", { ascending: true });
```

楽観的UIパターン：
- `commentMap` state（`Record<string, CommentEntry[]>`）で管理
- 追加: 即座に配列に追加 → 非同期でINSERT
- 編集: 即座にテキスト更新 → 非同期でUPDATE
- 削除: 即座に配列から除外 → 非同期でDELETE

### 5.2 `src/app/(main)/page.tsx`（ホーム画面）

リアクション通知の拡張：

```typescript
// 既存: 新着リアクション数
const { count: reactionCount } = await supabase
  .from("log_reactions")
  .select("*", { count: "exact", head: true })
  .eq("daily_logs.author_id", userId)
  .neq("user_id", userId)
  .gt("created_at", lastChecked);

// 追加: 新着コメント数
const { count: commentCount } = await supabase
  .from("log_comments")
  .select("*, daily_logs!inner(author_id, family_id)", { count: "exact", head: true })
  .eq("daily_logs.author_id", userId)
  .neq("user_id", userId)
  .gt("created_at", lastChecked);

// 合算して ReactionNotice に渡す
const totalNewCount = (reactionCount ?? 0) + (commentCount ?? 0);
```

### 5.3 `ReactionNotice` 変更

表示テキストを変更：
- リアクションのみ: 「○件の新しいリアクション」（既存のまま）
- コメントのみ: 「○件の新しいコメント」
- 両方: 「○件の新しいリアクション・コメント」

## 6. テスト

### 6.1 `__tests__/schemas/comment.test.ts`（新規）

- 正常なコメント（1〜100文字）
- 空文字 → バリデーションエラー
- 空白のみ → バリデーションエラー
- 101文字以上 → バリデーションエラー

### 6.2 `__tests__/lib/comments.test.ts`（新規）

- `buildCommentMap`: 空配列、複数ログ、ソート順
- エッジケース: 同一ユーザー複数コメント

## 7. 影響範囲

| ファイル | 変更種別 |
|---------|---------|
| `supabase/migrations/20260305100000_add_log_comments.sql` | 新規 |
| `src/types/database.ts` | 自動生成（Supabase CLI） |
| `src/types/index.ts` | 追加 |
| `src/schemas/comment.ts` | 新規 |
| `src/lib/comments.ts` | 新規 |
| `src/components/log/comment-section.tsx` | 新規 |
| `src/components/log/comment-item.tsx` | 新規 |
| `src/components/log/log-card.tsx` | 変更 |
| `src/components/home/reaction-notice.tsx` | 変更 |
| `src/app/(main)/logs/page.tsx` | 変更 |
| `src/app/(main)/page.tsx` | 変更 |
| `__tests__/schemas/comment.test.ts` | 新規 |
| `__tests__/lib/comments.test.ts` | 新規 |
| `docs/functional-design.md` | 更新 |

## 8. 永続的ドキュメント更新

`docs/functional-design.md` に以下を追加・更新：
- `log_comments` テーブル定義
- RLSポリシー
- コンポーネント一覧に `CommentSection`, `CommentItem` を追加
- 「9.4 家族間のリアクション」セクションにコメント仕様を追記
- 「10.4 家族コメント」のステータスを「実装済み」に変更
