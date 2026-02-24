# モバイルレイアウト修正 タスクリスト

## ステータス凡例
- [ ] 未着手
- [x] 完了

---

## Phase 1: BottomNav 新設

- [ ] `src/components/layout/bottom-nav.tsx` を新規作成
  - `lucide-react` から `Home, Calendar, BookOpen, Mail, Users` をインポート
  - `fixed bottom-0 left-0 right-0 z-50 flex md:hidden glass border-t border-border/50`
  - `grid grid-cols-5` で5タブ均等配置
  - 各タブ: `flex flex-col items-center gap-0.5 py-2 min-h-[56px] w-full touch-manipulation`
  - セーフエリア対応: `pb-[env(safe-area-inset-bottom)]`
  - アクティブ: `text-primary font-medium`, 非アクティブ: `text-muted-foreground`

## Phase 2: Header / Nav 修正

- [ ] `src/components/layout/nav.tsx`
  - `NavProps: { className?: string }` を追加
  - `cn(className, "flex gap-1")` で外部クラスを受け取れるように

- [ ] `src/components/layout/header.tsx`
  - `<Nav />` を `<div className="hidden md:flex">` で囲む（または Nav に className を渡す）
  - ログアウトボタンに `hidden md:inline-block` を追加
  - 設定アイコン周りのボーダーを `md:border-l md:border-border/40 md:pl-3` に変更

## Phase 3: メインレイアウト更新

- [ ] `src/app/(main)/layout.tsx`
  - `BottomNav` をインポート
  - `<main className="... pb-24 md:pb-8">` に変更
  - `<BottomNav />` を `</div>` の直前に追加

## Phase 4: MoodSelector レスポンシブ化

- [ ] `src/components/log/mood-selector.tsx`
  - `<div className="flex gap-3">` → `<div className="flex flex-wrap justify-center gap-2 sm:gap-3">`
  - ボタンから `style={{ width: "5rem", height: "5rem" }}` を削除
  - ボタンの `className` に `w-16 h-16 sm:w-20 sm:h-20` を追加

## Phase 5: LogCard 編集/削除ボタン修正

- [ ] `src/components/log/log-card.tsx`
  - `opacity-0 transition-opacity group-hover:opacity-100`
    → `transition-opacity sm:opacity-0 sm:group-hover:opacity-100`

## Phase 6: カレンダーセル タッチターゲット拡大

- [ ] `src/components/calendar/calendar-day-cell.tsx`
  - `rounded-xl py-1.5` → `rounded-xl py-2 min-h-[48px]`

## Phase 7: 写真削除ボタン タッチターゲット拡大

- [ ] `src/components/log/photo-uploader.tsx`
  - 削除ボタンのサイズを拡大（ファイル確認後に決定）

## Phase 8: globals.css touch-action 追加

- [ ] `src/app/globals.css`
  - `button, a, [role="button"] { touch-action: manipulation; }` を追加

## 品質チェック

- [ ] `pnpm type-check` エラーなし
- [ ] `pnpm lint` エラーなし
- [ ] `pnpm build` 成功

## コミット

- [ ] `git add` + `git commit`
