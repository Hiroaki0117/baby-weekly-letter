# タスクリスト: モバイルナビゲーション「その他」メニュー追加

## Phase 1: 実装

- [ ] `bottom-nav.tsx` を変更
  - navItems から統計を除去（4項目に）
  - 「その他」ボタンを追加（MoreHorizontal アイコン）
  - メニュー開閉の useState 管理
  - オーバーレイメニュー UI（統計・家族・設定・ログアウト）
  - /stats, /family, /settings アクティブ時に「その他」をハイライト
  - メニュー外タップ・項目選択で閉じる
  - ログアウト処理（supabase.auth.signOut）

## Phase 2: 品質チェック

- [ ] `pnpm lint`
- [ ] `pnpm type-check`
- [ ] `pnpm test`

## Phase 3: コミット・プッシュ

- [ ] ステアリングドキュメント + 実装をコミット・プッシュ
