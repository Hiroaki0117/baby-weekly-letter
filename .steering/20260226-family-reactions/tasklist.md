# 家族間リアクション機能 - タスクリスト

## タスク一覧

### 1. データベース・型定義

- [ ] 1-1. マイグレーションファイル作成（`20260226100000_add_log_reactions.sql`）
  - log_reactions テーブル作成
  - RLS ポリシー設定（SELECT / INSERT / DELETE）
  - インデックス作成
- [ ] 1-2. `src/types/database.ts` に log_reactions テーブル型を追加
- [ ] 1-3. `src/types/index.ts` に LogReaction, ReactionSummary 型とスタンプ定数を追加

### 2. ロジック層

- [ ] 2-1. `src/lib/reactions.ts` を作成
  - `buildReactionMap()` — 生データ → ログID別 ReactionSummary[] に変換
  - `toggleReaction()` — INSERT or DELETE のトグル処理

### 3. UIコンポーネント

- [ ] 3-1. `src/components/log/reaction-bar.tsx` を作成
  - スタンプ5つの横並び表示
  - 自分が押したスタンプのハイライト
  - 件数表示
  - トグルのコールバック
- [ ] 3-2. `src/components/home/reaction-notice.tsx` を作成
  - 新着リアクション件数の表示
  - タップでログ一覧へ遷移
  - localStorage による最終確認日時管理

### 4. 既存画面への組み込み

- [ ] 4-1. `LogCard` に ReactionBar を組み込み
  - props に reactions, onToggle を追加
  - カテゴリバッジの下に配置
- [ ] 4-2. ホーム画面（`page.tsx`）にリアクション機能を組み込み
  - ログ取得時にリアクションを一括取得
  - ReactionNotice の表示
  - onToggle ハンドラーの実装（楽観的更新）
- [ ] 4-3. ログ一覧画面（`logs/page.tsx`）にリアクション機能を組み込み
  - ログ取得時にリアクションを一括取得
  - onToggle ハンドラーの実装（楽観的更新）

### 5. 品質チェック

- [ ] 5-1. lint / type-check / test の実施・修正
- [ ] 5-2. Supabase にマイグレーション適用確認
