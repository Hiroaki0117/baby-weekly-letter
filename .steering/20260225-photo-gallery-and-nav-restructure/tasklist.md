# タスクリスト: 写真ギャラリー + ナビ構成変更

## Phase 1: ナビ構成変更

- [x] 1-1. `nav.tsx` を更新（「通信」「設定」削除、「写真」追加、5項目に）
- [x] 1-2. `bottom-nav.tsx` を更新（同上、`grid-cols-5` に変更）
- [x] 1-3. `header.tsx` を更新（設定アイコンを右端に追加）
- [x] 1-4. スマホ版の設定導線を追加（家族ページに設定リンク配置）

## Phase 2: 通信の記録ページ統合

- [x] 2-1. `logs-tabs.tsx` を新規作成（記録 / 週次 / 月次の3タブ）
- [x] 2-2. `logs/page.tsx` にタブ切替を追加し、通信機能を統合
- [x] 2-3. `/weekly/page.tsx` を `/logs?tab=weekly` へリダイレクトに変更

## Phase 3: 写真ギャラリー

- [x] 3-1. `photo-modal.tsx` を作成（拡大写真 + ログ情報表示）
- [x] 3-2. `photo-grid.tsx` を作成（月別セクション + 3列グリッド + 遅延ロード）
- [x] 3-3. `gallery/page.tsx` を作成（データ取得 + スクロール連続表示 + 空状態）
- [x] 3-4. `gallery.ts` ユーティリティ作成 + テスト（7件）

## Phase 4: 品質チェック

- [x] 4-1. `pnpm lint` パス
- [x] 4-2. `pnpm type-check` パス
- [x] 4-3. `pnpm test` パス（79件全パス）
- [x] 4-4. commit & push
