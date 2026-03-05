# v3.4 家族コメント機能 - タスクリスト

## フェーズ1: データ基盤

- [x] 1-1. マイグレーション作成（`log_comments` テーブル + RLS + トリガー）
- [x] 1-2. Supabase 型定義更新（`database.ts` 手動追加 + `index.ts` エイリアス）
- [x] 1-3. Zodスキーマ作成（`src/schemas/comment.ts`）+ テスト
- [x] 1-4. ロジック層作成（`src/lib/comments.ts`：buildCommentMap, addComment, updateComment, deleteComment）+ テスト

## フェーズ2: UIコンポーネント

- [x] 2-1. `CommentItem` 作成（個別コメント表示・編集切替・削除）
- [x] 2-2. `CommentSection` 作成（一覧表示 + 入力欄 + 送信）
- [x] 2-3. `LogCard` にコメントセクション統合（ReactionBar 下部に配置）

## フェーズ3: ページ統合

- [x] 3-1. `logs/page.tsx` にコメント取得・楽観的UI（追加/編集/削除）を実装
- [x] 3-2. `page.tsx`（ホーム）に新着コメント数カウントを追加
- [x] 3-3. `ReactionNotice` をリアクション + コメント統合通知に変更

## フェーズ4: 仕上げ

- [x] 4-1. 品質チェック（lint / type-check / test）
- [x] 4-2. `docs/functional-design.md` 更新（テーブル定義・コンポーネント・機能説明）
