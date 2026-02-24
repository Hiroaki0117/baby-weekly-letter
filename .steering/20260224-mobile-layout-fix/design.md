# モバイルレイアウト修正 設計

## アーキテクチャ方針

- **モバイルファースト**: `sm:` / `md:` ブレークポイントで段階的にデスクトップ向けスタイルを追加
- **新規コンポーネント最小化**: BottomNav のみ新規作成、既存コンポーネントを修正
- **後方互換性**: デスクトップ（md: 768px 以上）の見た目・操作は変更しない

## コンポーネント設計

### 1. BottomNav（新規）

```
src/components/layout/bottom-nav.tsx
```

- `"use client"` クライアントコンポーネント（usePathname 使用）
- `fixed bottom-0 left-0 right-0 z-50`: 画面下部に固定
- `flex md:hidden`: モバイルのみ表示
- `grid grid-cols-5`: 5タブ均等配置
- `h-14 pb-[env(safe-area-inset-bottom)]`: セーフエリア対応（iPhone ノッチ/ホームインジケーター）
- `glass border-t border-border/50`: 既存の glass スタイルを流用
- 各タブリンク: `flex flex-col items-center gap-0.5 py-2 min-h-[56px]`
- アクティブ: `text-primary`、非アクティブ: `text-muted-foreground`
- アイコン: `lucide-react` の `Home`, `Calendar`, `BookOpen`, `Mail`, `Users`（既存依存関係）

### 2. Nav（修正）

```
src/components/layout/nav.tsx
```

- `className?: string` prop 追加
- `cn(className, "flex gap-1")` で className を外から注入可能に

### 3. Header（修正）

```
src/components/layout/header.tsx
```

- Nav の wrapper に `hidden md:flex` を追加（Nav 自体に直接クラスを渡す方法もあるが、シンプルに wrapper div を追加）
- ログアウトボタンに `hidden md:block` を追加
- 設定アイコンリンク周りのボーダー: `md:border-l md:pl-3` に変更（モバイルではボーダー不要）

### 4. MainLayout（修正）

```
src/app/(main)/layout.tsx
```

- `<BottomNav />` を追加（`</div>` の前、`<main>` の後）
- `<main>` の `py-8` を `py-8 pb-24 md:pb-8` に変更（ボトムナビ分の余白確保）

### 5. MoodSelector（修正）

```
src/components/log/mood-selector.tsx
```

- `<div className="flex gap-3">` → `<div className="flex flex-wrap justify-center gap-2 sm:gap-3">`
- `<button ... style={{ width: "5rem", height: "5rem" }}>` → style 削除 + `className` に `w-16 h-16 sm:w-20 sm:h-20` 追加

### 6. LogCard（修正）

```
src/components/log/log-card.tsx
```

- `opacity-0 transition-opacity group-hover:opacity-100`
  → `transition-opacity sm:opacity-0 sm:group-hover:opacity-100`（モバイルでは opacity なし = 常時表示）

### 7. CalendarDayCell（修正）

```
src/components/calendar/calendar-day-cell.tsx
```

- クラス文字列に `min-h-[48px]` を追加

### 8. PhotoUploader（修正）

```
src/components/log/photo-uploader.tsx
```

- 削除ボタンのサイズを `h-6 w-6` → `h-7 w-7` + 見えないパディングで44px確保する
  （実装時にファイルを確認して最適な修正を決定）

### 9. globals.css（修正）

```
src/app/globals.css
```

```css
button, a, [role="button"] {
  touch-action: manipulation;
}
```

## ブレークポイント戦略

| ブレークポイント | 幅 | 適用 |
|---|---|---|
| デフォルト（モバイル） | 0〜767px | BottomNav 表示、Header にナビなし |
| `md:` | 768px〜 | BottomNav 非表示、Header にナビ表示 |
| `sm:` | 640px〜 | MoodSelector フルサイズ、LogCard hover動作 |
