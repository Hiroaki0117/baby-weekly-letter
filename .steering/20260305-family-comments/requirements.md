# v3.4 家族コメント機能 - 要求定義

## 概要

日次ログに対して家族メンバーが短文コメントを残せる機能を追加する。既存のスタンプリアクションに加えて、言葉でも気持ちを伝えられるようにし、祖父母世代の参加ハードルを下げる。

## ユーザーストーリー

> 育児中の親や祖父母として、記録にコメントを残したい。それにより、スタンプだけでなく言葉でも気持ちを伝えたい。（US-14）

## 機能要件

### コメント投稿

- 日次ログに対して短文コメントを投稿できる
- 1コメントあたり最大 **100文字**
- 空文字・空白のみのコメントは投稿不可
- 同一ログに対して同一ユーザーが複数コメント可能

### コメント表示

- ログカード内のリアクションバーの下にインライン表示（常時展開）
- コメントごとに投稿者の表示名と投稿日時を表示
- コメントは投稿日時の **昇順**（古い順）で表示
- コメント入力欄はコメント一覧の下部に常時表示

### コメント編集・削除

- 自分のコメントは **編集・削除可能**
- 他ユーザーのコメントは編集・削除不可
- 編集時はインラインで入力欄に切り替え

### 通知

- 既存のリアクション通知（ホーム画面の `ReactionNotice`）にコメントも統合
- 「○件の新しいリアクション・コメント」として表示
- localStorage の `lastReactionCheckedAt` を共有して新着判定

## 対象外

- 週次通信・月次通信へのコメント
- Push通知（Web Push）
- コメントへの返信（スレッド機能）
- コメント内の@メンション

## データモデル

### `log_comments` テーブル

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| log_id | uuid | NOT NULL | | FK → daily_logs（ON DELETE CASCADE） |
| user_id | uuid | NOT NULL | | FK → auth.users |
| text | text | NOT NULL | | 最大100文字 |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- インデックス: `log_id`
- CHECK制約: `char_length(text) <= 100 AND char_length(trim(text)) > 0`

### RLS ポリシー

| 操作 | ポリシー名 | 条件 |
|------|-----------|------|
| SELECT | select_family_comments | daily_logs JOIN で family_id = my_family_id() |
| INSERT | insert_own_comment | user_id = auth.uid() AND daily_logs JOIN で family_id = my_family_id() |
| UPDATE | update_own_comment | user_id = auth.uid() |
| DELETE | delete_own_comment | user_id = auth.uid() |

## 受け入れ条件

- [ ] 日次ログカードにコメント入力欄と一覧が表示される
- [ ] コメントを投稿すると楽観的UIで即時反映される
- [ ] 自分のコメントを編集・削除できる
- [ ] 他ユーザーのコメントは編集・削除できない
- [ ] 100文字を超えるコメントは投稿できない
- [ ] ホーム画面の通知にコメントの新着が含まれる
- [ ] 投稿者の表示名が正しく表示される
- [ ] ログ削除時にコメントもカスケード削除される
