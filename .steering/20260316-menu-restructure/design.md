# メニュー構成の再編成 - 設計

## 1. URL構造の変更

| 現状 | 変更後 | 備考 |
|------|--------|------|
| `/calendar` | `/diary` | 日記ページ（カレンダー + 一覧統合） |
| `/logs` | `/diary` | 日記ページに統合 |
| `/logs?tab=photos` | `/album?tab=photos` | アルバムページ |
| `/logs?tab=weekly` | `/album?tab=weekly` | アルバムページ |
| `/logs?tab=monthly` | `/album?tab=monthly` | アルバムページ |
| `/logs?tab=annual` | `/album?tab=annual` | アルバムページ |
| `/logs?tab=report-settings` | `/album?tab=settings` | アルバムページ |
| `/stats` | `/report` | レポートページ（名前変更のみ） |
| `/gallery` | `/album?tab=photos` | リダイレクト先変更 |
| `/weekly` | `/album?tab=weekly` | リダイレクト先変更 |

## 2. ページ構成

### 2.1 日記ページ（`/diary`）

新規ページ。カレンダー表示と一覧表示を切り替えるタブを持つ。

```
/diary
├── ?view=calendar  （カレンダー表示、デフォルト）
└── ?view=list      （一覧表示）
```

**カレンダー表示:**
- 現状の `/calendar/page.tsx` のコンポーネント・ロジックをそのまま流用
- カレンダーグリッド、月ナビゲーション、日付タップでログ展開

**一覧表示:**
- 現状の `/logs/page.tsx` の「記録」タブのコンポーネント・ロジックを流用
- フィルター機能（気分・カテゴリ・子供・マイルストーン・テキスト検索）
- ログカード表示、編集・削除

**切り替えUI:**
- ページ上部にカレンダーアイコン / リストアイコンの切り替えボタン（トグル）
- URL searchParams `view` で状態を保持

### 2.2 アルバムページ（`/album`）

新規ページ。現状の `/logs/page.tsx` から写真・アルバム関連のタブを抽出。

```
/album
├── ?tab=photos    （写真、デフォルト）
├── ?tab=weekly    （週次アルバム）
├── ?tab=monthly   （月次アルバム）
├── ?tab=annual    （年次アルバム）
└── ?tab=settings  （レポート設定）
```

- 現状の `/logs/page.tsx` 内のタブ構造（photos / weekly / monthly / annual / report-settings）をそのまま踏襲
- タブUI・データ取得ロジック・コンポーネントは既存のものを流用
- 子供セレクターも引き続き表示

### 2.3 レポートページ（`/report`）

現状の `/stats/page.tsx` をそのまま `/report/page.tsx` に移動。

- コンポーネント・ロジックに変更なし
- ページタイトルのみ「統計」→「レポート」に変更（表示されている場合）

### 2.4 個別レポート表示ページ

| 現状 | 変更後 |
|------|--------|
| `/weekly/[id]/page.tsx` | `/album/weekly/[id]/page.tsx` |
| `/weekly/monthly/[id]/page.tsx` | `/album/monthly/[id]/page.tsx` |

## 3. ナビゲーションの変更

### 3.1 PC版ヘッダー（`nav.tsx`）

```typescript
const navItems = [
  { href: "/", label: "今日", icon: Home },
  { href: "/diary", label: "日記", icon: BookOpen },
  { href: "/album", label: "アルバム", icon: ImageIcon },
  { href: "/report", label: "レポート", icon: BarChart3 },
];
```

- 5項目 → 4項目に削減
- `Calendar` アイコンは日記ページ内の切り替えで使用するため、ナビには `BookOpen` を採用

### 3.2 スマホ版ボトムナビ（`bottom-nav.tsx`）

```typescript
const navItems = [
  { href: "/", label: "今日", icon: Home },
  { href: "/diary", label: "日記", icon: BookOpen },
  { href: "/album", label: "アルバム", icon: ImageIcon },
  { href: "/report", label: "レポート", icon: BarChart3 },
];
```

- メニュー項目を変更（grid-cols-5 はその他を含め5列のまま）

## 4. リダイレクト対応

旧URLからのアクセスを新URLにリダイレクトする。各旧ページの `page.tsx` を `redirect()` のみのファイルに置き換え。

| 旧URL | リダイレクト先 |
|-------|---------------|
| `/calendar` | `/diary?view=calendar` |
| `/logs` | `/diary?view=list` |
| `/logs?tab=photos` | `/album?tab=photos` |
| `/logs?tab=weekly` | `/album?tab=weekly` |
| `/logs?tab=monthly` | `/album?tab=monthly` |
| `/logs?tab=annual` | `/album?tab=annual` |
| `/logs?tab=report-settings` | `/album?tab=settings` |
| `/gallery` | `/album?tab=photos` |
| `/weekly` | `/album?tab=weekly` |
| `/stats` | `/report` |

## 5. 影響範囲

### 変更が必要なファイル

- `src/components/layout/nav.tsx` — メニュー項目変更
- `src/components/layout/bottom-nav.tsx` — メニュー項目変更
- `src/app/(main)/diary/page.tsx` — 新規作成（カレンダー + 一覧統合）
- `src/app/(main)/album/page.tsx` — 新規作成（写真 + アルバム）
- `src/app/(main)/album/weekly/[id]/page.tsx` — 移動
- `src/app/(main)/album/monthly/[id]/page.tsx` — 移動
- `src/app/(main)/report/page.tsx` — `/stats` から移動
- `src/app/(main)/calendar/page.tsx` — リダイレクトに置き換え
- `src/app/(main)/logs/page.tsx` — リダイレクトに置き換え
- `src/app/(main)/gallery/page.tsx` — リダイレクト先変更
- `src/app/(main)/weekly/page.tsx` — リダイレクト先変更
- `src/app/(main)/stats/page.tsx` — リダイレクトに置き換え

### 変更不要なもの

- 各コンポーネント（`src/components/`）— 流用するのみ
- API（`src/app/api/`）— URLに依存しない
- データ取得ロジック（`src/lib/`）— 変更なし
