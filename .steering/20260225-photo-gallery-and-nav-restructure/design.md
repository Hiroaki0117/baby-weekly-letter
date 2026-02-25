# 設計: 写真ギャラリー + ナビ構成変更

## 変更ファイル一覧

### 新規作成

| ファイル | 説明 |
|---------|------|
| `src/app/(main)/gallery/page.tsx` | 写真ギャラリーページ |
| `src/components/gallery/photo-grid.tsx` | 月別写真グリッドコンポーネント |
| `src/components/gallery/photo-modal.tsx` | 写真拡大モーダル（ログ情報付き） |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/components/layout/nav.tsx` | 「通信」→「写真」に入替、「設定」を削除 |
| `src/components/layout/bottom-nav.tsx` | 同上 |
| `src/components/layout/header.tsx` | 設定アイコンを右端に追加（PC版） |
| `src/app/(main)/logs/page.tsx` | タブ切替（記録 / 週次 / 月次）を追加、通信機能を統合 |
| `src/components/weekly/report-tabs.tsx` | 3タブ対応に拡張（記録 / 週次 / 月次） |

### 変更なし（維持）

| ファイル | 理由 |
|---------|------|
| `src/app/(main)/weekly/page.tsx` | 直接URL `/weekly` でのアクセスは維持（リダイレクト or 残す） |
| `src/app/(main)/weekly/[id]/page.tsx` | 通信詳細ページはそのまま維持 |
| `src/app/(main)/weekly/monthly/[id]/page.tsx` | 月次詳細ページはそのまま維持 |

---

## 1. 写真ギャラリーページ

### データ取得

```typescript
// daily_logs から photo_storage_path が存在するレコードを取得
const { data } = await supabase
  .from("daily_logs")
  .select("id, log_date, text, mood, child_id, photo_storage_path")
  .not("photo_storage_path", "is", null)
  .order("log_date", { ascending: false })
  .order("created_at", { ascending: false });
```

- 初回で全件取得し、クライアント側で月別にグルーピング
- 写真URLは Supabase Storage の `createSignedUrl` で取得

### 写真URL取得の最適化

一度に全写真の signed URL を取得するとパフォーマンスが悪いため、段階的に取得する。

1. **初期表示**: 直近2ヶ月分の写真のみ signed URL を取得
2. **スクロール**: Intersection Observer で月セクションが画面に入ったら、その月の signed URL を取得

### コンポーネント構成

```
gallery/page.tsx
├── PhotoGrid (月別セクション × N)
│   ├── 月ヘッダー（「2026年2月・5枚」）
│   └── 3列グリッド
│       └── サムネイル画像（正方形、object-cover）
│           └── ChildBadge（2人以上の場合）
└── PhotoModal（拡大表示）
    ├── 拡大写真
    ├── 日付
    ├── 気分スタンプ
    └── テキスト（ログ本文）
```

### PhotoGrid コンポーネント

```typescript
type MonthGroup = {
  label: string;       // "2026年2月"
  photos: PhotoItem[];
};

type PhotoItem = {
  logId: string;
  logDate: string;
  text: string;
  mood: string;
  childId: string;
  storagePath: string;
  signedUrl: string | null;  // 遅延取得
};
```

- 月セクションごとに `<section>` で区切る
- 月ヘッダーに月名 + 枚数を表示
- グリッドは `grid grid-cols-3 gap-1`（Instagram風の密なグリッド）
- 写真がない月はセクション自体をスキップ

### PhotoModal コンポーネント

- オーバーレイ付きモーダル（背景タップで閉じる）
- 写真を画面幅いっぱいに表示
- 下部にログ情報（日付・気分・テキスト）
- 左右スワイプで前後の写真に移動（将来拡張としてもよい。初回はタップで閉じる→グリッドから別写真を選ぶ形でも可）
- ESCキー / ✕ボタンで閉じる

### 空状態

```
┌─────────────────────────────────┐
│                                  │
│       📷                         │
│   まだ写真がありません            │
│   記録に写真を添付してみましょう   │
│                                  │
└─────────────────────────────────┘
```

---

## 2. 通信の記録ページ統合

### タブ構成

`/logs` ページに3タブを配置する。

```
┌──────────┬──────────┬──────────┐
│   記録    │  週次通信  │ 月次まとめ │
└──────────┴──────────┴──────────┘
```

- URL: `/logs`（デフォルトで「記録」タブ）
- URL: `/logs?tab=weekly`（週次通信タブ）
- URL: `/logs?tab=monthly`（月次まとめタブ）

### 実装方針

- 既存の `ReportTabs` コンポーネントを3タブに拡張
- `/logs/page.tsx` 内で `activeTab` に応じて表示を切り替え
  - `"logs"`: 既存のログ一覧（フィルター含む）
  - `"weekly"`: 既存の `weekly/page.tsx` の内容を移植
  - `"monthly"`: 既存の `weekly/page.tsx` の月次タブ内容を移植
- 既存の `/weekly/page.tsx` は `/logs?tab=weekly` へリダイレクト

### 既存ページの扱い

| パス | 対応 |
|------|------|
| `/weekly` | `/logs?tab=weekly` へリダイレクト |
| `/weekly/[id]` | そのまま維持（通信詳細は独立ページ） |
| `/weekly/monthly/[id]` | そのまま維持（月次詳細は独立ページ） |

---

## 3. ナビ構成変更

### PC版ヘッダー（nav.tsx + header.tsx）

**nav.tsx の navItems:**
```typescript
const navItems = [
  { href: "/", label: "今日", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/logs", label: "記録", icon: BookOpen },
  { href: "/gallery", label: "写真", icon: ImageIcon },
  { href: "/family", label: "家族", icon: Users },
];
```

**header.tsx:**
- ログアウトボタンの隣に設定アイコン（歯車）を追加
- 以前のコードを復元する形

### スマホ版ボトムバー（bottom-nav.tsx）

**navItems を nav.tsx と同じ5項目に変更。**

**設定への導線（スマホ版）:**
- ボトムバーからは削除
- スマホ版のヘッダーは非表示（`hidden md:block`）なので、別の導線が必要
- 方針: **家族ページに「設定」リンクを配置** or **ボトムバー上部に小さなヘッダーバーを追加**
- 採用案: 家族ページの上部に「設定」ボタンを追加するのが最もシンプル。設定はめったに使わないので家族ページ経由で十分。

---

## 4. UI デザイン

### 写真ギャラリーページ

```
┌─────────────────────────────────┐
│  Photos          写真ギャラリー   │
├─────────────────────────────────┤
│                                  │
│  ── 2026年2月・5枚 ──           │
│                                  │
│  ┌────┐ ┌────┐ ┌────┐          │
│  │    │ │    │ │    │          │
│  │ 📷 │ │ 📷 │ │ 📷 │          │
│  │    │ │    │ │    │          │
│  └────┘ └────┘ └────┘          │
│  ┌────┐ ┌────┐                  │
│  │    │ │    │                  │
│  │ 📷 │ │ 📷 │                  │
│  │    │ │    │                  │
│  └────┘ └────┘                  │
│                                  │
│  ── 2026年1月・8枚 ──           │
│                                  │
│  ┌────┐ ┌────┐ ┌────┐          │
│  │    │ │    │ │    │          │
│  │ 📷 │ │ 📷 │ │ 📷 │          │
│  │    │ │    │ │    │          │
│  └────┘ └────┘ └────┘          │
│  ...                             │
└─────────────────────────────────┘
```

### 写真拡大モーダル

```
┌─────────────────────────────────┐
│                              ✕  │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │                           │  │
│  │         拡大写真           │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                  │
│  2026年2月14日（金）  🥰        │
│  バレンタインの日。チョコを       │
│  もらって嬉しそうな顔をした…     │
│                                  │
└─────────────────────────────────┘
```

### 記録ページ（タブ統合後）

```
┌─────────────────────────────────┐
│  All Records    記録一覧    003  │
├─────────────────────────────────┤
│                                  │
│  ┌────────┬────────┬────────┐   │
│  │  記録   │ 週次通信 │月次まとめ│   │
│  └────────┴────────┴────────┘   │
│                                  │
│  （選択中のタブの内容）           │
│                                  │
└─────────────────────────────────┘
```

---

## 5. 実装順序

| Phase | 内容 | 影響範囲 |
|-------|------|---------|
| 1 | ナビ構成変更（nav.tsx, bottom-nav.tsx, header.tsx） | レイアウト |
| 2 | 通信の記録ページ統合（logs/page.tsx, report-tabs 拡張） | /logs, /weekly |
| 3 | 写真ギャラリー（gallery/page.tsx, photo-grid, photo-modal） | 新規ページ |
| 4 | 品質チェック（lint, type-check, test） | 全体 |

Phase 1 → 2 → 3 の順で進める。ナビ変更を先にやることで、写真ギャラリーページ作成時にナビから直接遷移確認ができる。
