# 設計: フッターナビ再構成

## 変更ファイル

### 1. `src/components/layout/bottom-nav.tsx`
- `navItems` から `/gallery` を削除し、`/stats` を追加（アイコン: `BarChart3`）
- `moreMenuItems` から `/stats` を削除
- `morePaths` から `/stats` を削除

### 2. `src/components/log/logs-tabs.tsx`
- `LogsTab` 型に `"photos"` を追加
- `TopCategory` に `"photos"` を追加（3つの大項目タブ: 記録 / 写真 / アルバム）
- `getTopCategory` を更新
- 大項目タブに「📸 写真」ボタンを追加（記録とアルバムの間）

### 3. `src/app/(main)/logs/page.tsx`
- `LogsTab` の valid タブリストに `"photos"` を追加
- `headerInfo` に `photos` を追加
- ギャラリーのデータ取得ロジックを `load()` に追加
- `activeTab === "photos"` のとき写真ギャラリーを表示
- 既存の `PhotoGrid` / `PhotoModal` コンポーネントを再利用

### 4. `src/app/(main)/gallery/page.tsx`
- `/logs?tab=photos` にリダイレクトする簡易コンポーネントに置き換え

## 方針
- `PhotoGrid` / `PhotoModal` コンポーネントはそのまま再利用
- ギャラリーのデータ取得は `logs/page.tsx` の既存 `load()` に統合
- `/gallery` 直リンク対応のためリダイレクトを設置
