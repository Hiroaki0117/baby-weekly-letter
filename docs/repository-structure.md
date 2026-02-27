# リポジトリ構造定義書

## 1. ディレクトリ構成

```
baby-weekly-letter/
├── .env.local                    # ローカル環境変数（git管理外）
├── next.config.ts                # Next.js設定
├── tsconfig.json                 # TypeScript設定
├── package.json
├── pnpm-lock.yaml
├── CLAUDE.md                     # プロジェクトメモリ
├── README.md
│
├── docs/                         # 永続的ドキュメント
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── development-guidelines.md
│   └── glossary.md
│
├── .steering/                    # 作業単位ドキュメント
│   └── YYYYMMDD-xxx/
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
│
├── public/                       # 静的ファイル
│   └── favicon.ico
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── globals.css           # グローバルCSS
│   │   │
│   │   ├── (auth)/               # 認証グループ（レイアウト共有）
│   │   │   ├── layout.tsx        # 認証用レイアウト
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # ログイン画面
│   │   │   ├── signup/
│   │   │   │   └── page.tsx      # アカウント登録画面
│   │   │   └── onboarding/
│   │   │       └── page.tsx      # オンボーディング画面
│   │   │
│   │   ├── (main)/               # メイングループ（認証必須）
│   │   │   ├── layout.tsx        # メインレイアウト（ヘッダー・ナビ）
│   │   │   ├── page.tsx          # ホーム（今日のログ入力）
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx      # カレンダー画面
│   │   │   ├── logs/
│   │   │   │   └── page.tsx      # 記録一覧画面（ログ・週次・月次タブ）
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx      # 写真ギャラリー画面
│   │   │   ├── stats/
│   │   │   │   └── page.tsx      # 統計ダッシュボード画面
│   │   │   ├── family/
│   │   │   │   └── page.tsx      # 家族管理画面
│   │   │   ├── settings/
│   │   │   │   └── page.tsx      # 設定画面
│   │   │   └── weekly/
│   │   │       ├── page.tsx      # 週次通信一覧（リダイレクト）
│   │   │       ├── [id]/
│   │   │       │   └── page.tsx  # 週次通信詳細画面
│   │   │       └── monthly/
│   │   │           └── [id]/
│   │   │               └── page.tsx  # 月次まとめ詳細画面
│   │   │
│   │   ├── invite/
│   │   │   └── [token]/
│   │   │       └── page.tsx      # 家族招待受け入れ画面
│   │   │
│   │   ├── api/                  # Route Handlers
│   │   │   ├── weekly-report/
│   │   │   │   └── generate/
│   │   │   │       └── route.ts  # 週次通信生成API
│   │   │   ├── monthly-report/
│   │   │   │   └── generate/
│   │   │   │       └── route.ts  # 月次まとめ生成API
│   │   │   └── family/
│   │   │       ├── create/
│   │   │       │   └── route.ts  # 家族作成API
│   │   │       ├── invite/
│   │   │       │   └── route.ts  # 招待リンク生成API
│   │   │       ├── join/
│   │   │       │   └── route.ts  # 家族参加API
│   │   │       └── members/
│   │   │           ├── route.ts  # メンバー一覧API
│   │   │           └── [userId]/
│   │   │               └── route.ts  # メンバー操作API
│   │   │
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts      # OAuth コールバック
│   │
│   ├── components/               # コンポーネント
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── ...
│   │   │
│   │   ├── child/                # 子供関連コンポーネント
│   │   │   ├── child-selector.tsx # 子供選択（記録フォーム用）
│   │   │   └── child-badge.tsx    # 子供名バッジ（記録カード用）
│   │   │
│   │   ├── log/                  # ログ関連コンポーネント
│   │   │   ├── log-form.tsx      # ログ入力・編集フォーム
│   │   │   ├── log-card.tsx      # ログ一覧のカード（リアクション付き）
│   │   │   ├── log-filter.tsx    # ログ絞り込み（気分・カテゴリ・テキスト・子供）
│   │   │   ├── logs-tabs.tsx     # タブ切り替え（ログ・週次・月次）
│   │   │   ├── mood-selector.tsx # 気分スタンプ選択
│   │   │   ├── category-picker.tsx # カテゴリ選択
│   │   │   ├── photo-uploader.tsx  # 写真アップロード
│   │   │   ├── reaction-bar.tsx    # スタンプリアクション表示・操作
│   │   │   └── author-badge.tsx    # 記録者バッジ
│   │   │
│   │   ├── weekly/               # 週次通信関連コンポーネント
│   │   │   ├── weekly-report-card.tsx  # 通信一覧カード
│   │   │   └── photo-gallery.tsx       # 写真一覧表示
│   │   │
│   │   ├── monthly/              # 月次まとめ関連コンポーネント
│   │   │   ├── monthly-report-card.tsx   # 月次まとめカード
│   │   │   └── monthly-photo-gallery.tsx # 月次写真一覧表示
│   │   │
│   │   ├── calendar/             # カレンダー関連コンポーネント
│   │   │   ├── calendar-grid.tsx  # カレンダーグリッド
│   │   │   └── month-picker.tsx   # 月選択ピッカー
│   │   │
│   │   ├── gallery/              # 写真ギャラリー関連コンポーネント
│   │   │   ├── photo-grid.tsx     # 写真グリッド表示
│   │   │   └── photo-modal.tsx    # 写真拡大モーダル
│   │   │
│   │   ├── stats/                # 統計関連コンポーネント
│   │   │   ├── mood-chart.tsx     # 記録数・気分の積み上げ棒グラフ
│   │   │   ├── category-pie-chart.tsx # カテゴリ別円グラフ
│   │   │   └── period-tabs.tsx    # 期間切り替えタブ
│   │   │
│   │   ├── memory/               # 思い出振り返り関連コンポーネント
│   │   │   ├── memories-section.tsx # ○年前の今日セクション
│   │   │   └── memory-card.tsx     # 過去の記録カード
│   │   │
│   │   ├── home/                 # ホーム画面固有コンポーネント
│   │   │   └── reaction-notice.tsx # リアクション新着通知
│   │   │
│   │   ├── family/               # 家族管理関連コンポーネント
│   │   │   ├── invite-link.tsx    # 招待リンク生成・共有
│   │   │   └── member-list.tsx    # 家族メンバー一覧
│   │   │
│   │   ├── export/               # エクスポート関連コンポーネント
│   │   │   ├── export-layout.tsx  # エクスポート専用レイアウト
│   │   │   └── share-menu.tsx     # 共有メニュー（PNG/PDF選択）
│   │   │
│   │   └── layout/               # レイアウト関連コンポーネント
│   │       ├── header.tsx        # デスクトップヘッダー
│   │       ├── nav.tsx           # デスクトップナビゲーション
│   │       └── bottom-nav.tsx    # モバイル用ボトムナビ
│   │
│   ├── lib/                      # ユーティリティ・ライブラリ
│   │   ├── supabase/
│   │   │   ├── client.ts         # ブラウザ用 Supabase Client
│   │   │   ├── server.ts         # サーバー用 Supabase Client
│   │   │   ├── middleware.ts     # 認証ミドルウェア
│   │   │   └── family.ts         # 家族関連DB操作
│   │   │
│   │   ├── gemini/
│   │   │   └── client.ts         # Gemini API クライアント
│   │   │
│   │   ├── weekly-report/
│   │   │   ├── generate.ts       # 週次通信生成ロジック
│   │   │   └── prompt.ts         # プロンプトテンプレート
│   │   │
│   │   ├── monthly-report/
│   │   │   ├── generate.ts       # 月次まとめ生成ロジック
│   │   │   └── prompt.ts         # 月次プロンプトテンプレート
│   │   │
│   │   ├── date.ts               # 日付ユーティリティ（date-fns ラッパー）
│   │   ├── utils.ts              # 汎用ユーティリティ（cn関数など）
│   │   ├── auth-error.ts         # 認証エラーハンドリング
│   │   ├── streak.ts             # 記録ストリーク計算
│   │   ├── gallery.ts            # ギャラリーデータ取得
│   │   ├── export.ts             # エクスポート処理（PNG/PDF）
│   │   ├── stats.ts              # 統計データ集計
│   │   ├── log-actions.ts        # ログCRUD操作
│   │   ├── reactions.ts          # リアクション操作・集計
│   │   └── memories.ts           # 過去の振り返りデータ取得
│   │
│   ├── types/                    # 型定義
│   │   ├── database.ts           # Supabase DB型（自動生成）
│   │   └── index.ts              # アプリ固有の型定義
│   │
│   ├── schemas/                  # Zodスキーマ
│   │   ├── log.ts                # ログ入力バリデーション
│   │   ├── weekly-report.ts      # 週次通信リクエストバリデーション
│   │   ├── monthly-report.ts     # 月次まとめリクエストバリデーション
│   │   ├── family.ts             # 家族関連バリデーション
│   │   └── profile.ts            # プロフィールバリデーション
│   │
│   └── middleware.ts             # Next.js ミドルウェア（認証ガード）
│
├── supabase/                     # Supabase ローカル設定
│   ├── config.toml               # Supabase CLI設定
│   └── migrations/               # DBマイグレーション
│       ├── 20260219000000_initial.sql
│       ├── 20260220000000_add_profiles.sql
│       ├── 20260221000000_add_monthly_reports.sql
│       ├── 20260223000000_add_family_group.sql
│       ├── 20260224000000_expand_mood_options.sql
│       ├── 20260225000000_add_child_id.sql
│       ├── 20260226000000_fix_delete_policy.sql
│       └── 20260226100000_add_log_reactions.sql
│
└── __tests__/                    # テスト
    ├── schemas/
    │   ├── log.test.ts
    │   ├── family.test.ts
    │   └── profile.test.ts
    └── lib/
        ├── date.test.ts
        ├── auth-error.test.ts
        ├── memories.test.ts
        ├── reactions.test.ts
        ├── stats.test.ts
        └── supabase/
            └── family.test.ts
```

---

## 2. ディレクトリの役割

| ディレクトリ | 役割 |
|-------------|------|
| `src/app/` | Next.js App Router のページ・レイアウト・API |
| `src/app/(auth)/` | 認証系画面（ログイン・登録・オンボーディング）。未認証ユーザー向けレイアウト |
| `src/app/(main)/` | メイン機能画面。認証済みユーザー向けレイアウト |
| `src/app/api/` | Route Handlers。サーバーサイドAPI（通信生成・家族操作） |
| `src/app/invite/` | 家族招待受け入れ画面 |
| `src/components/ui/` | shadcn/ui のコンポーネント。直接編集しない |
| `src/components/child/` | 子供関連コンポーネント（セレクタ・バッジ） |
| `src/components/log/` | ログ機能に関連するコンポーネント（リアクション含む） |
| `src/components/weekly/` | 週次通信機能に関連するコンポーネント |
| `src/components/monthly/` | 月次まとめ機能に関連するコンポーネント |
| `src/components/calendar/` | カレンダー機能に関連するコンポーネント |
| `src/components/gallery/` | 写真ギャラリー関連コンポーネント |
| `src/components/stats/` | 統計ダッシュボード関連コンポーネント |
| `src/components/memory/` | 過去の振り返り関連コンポーネント |
| `src/components/home/` | ホーム画面固有コンポーネント（リアクション通知） |
| `src/components/family/` | 家族管理関連コンポーネント（招待・メンバー一覧） |
| `src/components/export/` | エクスポート関連コンポーネント（専用レイアウト・共有メニュー） |
| `src/components/layout/` | ヘッダー・ナビなどレイアウト部品 |
| `src/lib/` | ビジネスロジック・外部サービスクライアント・ユーティリティ |
| `src/types/` | TypeScript 型定義 |
| `src/schemas/` | Zod バリデーションスキーマ |
| `supabase/` | Supabase CLI 設定・マイグレーション |
| `__tests__/` | テストファイル（src/ のディレクトリ構造に対応） |
| `docs/` | 永続的ドキュメント |
| `.steering/` | 作業単位のステアリングドキュメント |

---

## 3. ファイル配置ルール

### 3.1 コンポーネント

- 1ファイル1コンポーネントを原則とする
- ファイル名はケバブケース（例: `log-form.tsx`）
- コンポーネント名はパスカルケース（例: `LogForm`）
- 機能単位でサブディレクトリに分類する（`log/`, `weekly/`, `layout/`）
- shadcn/ui のコンポーネントは `components/ui/` に配置し、直接編集しない

### 3.2 ライブラリ・ユーティリティ

- 外部サービスクライアントは `lib/{service}/` に配置
- ビジネスロジックは `lib/{feature}/` に配置
- 汎用ユーティリティは `lib/utils.ts` に集約

### 3.3 型定義

- Supabase の DB 型は `types/database.ts` に自動生成する
- アプリ固有の型は `types/index.ts` に定義

### 3.4 テスト

- テストファイルは `__tests__/` に `src/` と同じ構造で配置
- ファイル名は `{対象ファイル名}.test.ts(x)` とする

### 3.5 マイグレーション

- `supabase/migrations/` に Supabase CLI が生成するSQLファイルを配置
- ファイル名は `YYYYMMDDHHMMSS_{description}.sql` の形式
