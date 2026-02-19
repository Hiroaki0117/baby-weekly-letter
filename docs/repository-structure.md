# リポジトリ構造定義書

## 1. ディレクトリ構成

```
baby-weekly-letter/
├── .env.local                    # ローカル環境変数（git管理外）
├── .eslintrc.json                # ESLint設定
├── .prettierrc                   # Prettier設定
├── next.config.ts                # Next.js設定
├── tailwind.config.ts            # Tailwind CSS設定
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
│   │   ├── page.tsx              # ルート（リダイレクト）
│   │   │
│   │   ├── (auth)/               # 認証グループ（レイアウト共有）
│   │   │   ├── layout.tsx        # 認証用レイアウト
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # ログイン画面
│   │   │   └── signup/
│   │   │       └── page.tsx      # アカウント登録画面
│   │   │
│   │   ├── (main)/               # メイングループ（認証必須）
│   │   │   ├── layout.tsx        # メインレイアウト（ヘッダー・ナビ）
│   │   │   ├── page.tsx          # ホーム（今日のログ入力）
│   │   │   ├── logs/
│   │   │   │   └── page.tsx      # ログ一覧画面
│   │   │   └── weekly/
│   │   │       ├── page.tsx      # 週次通信一覧画面
│   │   │       └── [id]/
│   │   │           └── page.tsx  # 週次通信詳細画面
│   │   │
│   │   ├── api/                  # Route Handlers
│   │   │   └── weekly-report/
│   │   │       └── generate/
│   │   │           └── route.ts  # 週次通信生成API
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts      # OAuth コールバック
│   │   │
│   │   └── globals.css           # グローバルCSS
│   │
│   ├── components/               # コンポーネント
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── log/                  # ログ関連コンポーネント
│   │   │   ├── log-form.tsx      # ログ入力・編集フォーム
│   │   │   ├── log-card.tsx      # ログ一覧のカード
│   │   │   ├── mood-selector.tsx # 気分スタンプ選択
│   │   │   ├── category-picker.tsx # カテゴリ選択
│   │   │   └── photo-uploader.tsx  # 写真アップロード
│   │   │
│   │   ├── weekly/               # 週次通信関連コンポーネント
│   │   │   ├── weekly-report-card.tsx  # 通信一覧カード
│   │   │   ├── weekly-report-detail.tsx # 通信詳細表示
│   │   │   └── photo-gallery.tsx       # 写真一覧表示
│   │   │
│   │   └── layout/               # レイアウト関連コンポーネント
│   │       ├── header.tsx        # ヘッダー
│   │       └── nav.tsx           # ナビゲーション
│   │
│   ├── lib/                      # ユーティリティ・ライブラリ
│   │   ├── supabase/
│   │   │   ├── client.ts         # ブラウザ用 Supabase Client
│   │   │   ├── server.ts         # サーバー用 Supabase Client
│   │   │   └── middleware.ts     # 認証ミドルウェア
│   │   │
│   │   ├── gemini/
│   │   │   └── client.ts         # Gemini API クライアント
│   │   │
│   │   ├── weekly-report/
│   │   │   ├── generate.ts       # 週次通信生成ロジック
│   │   │   └── prompt.ts         # プロンプトテンプレート
│   │   │
│   │   ├── date.ts               # 日付ユーティリティ（date-fns ラッパー）
│   │   └── utils.ts              # 汎用ユーティリティ（cn関数など）
│   │
│   ├── hooks/                    # カスタムフック
│   │   ├── use-auth.ts           # 認証状態管理
│   │   └── use-toast.ts          # トースト通知
│   │
│   ├── types/                    # 型定義
│   │   ├── database.ts           # Supabase DB型（自動生成）
│   │   └── index.ts              # アプリ固有の型定義
│   │
│   ├── schemas/                  # Zodスキーマ
│   │   ├── log.ts                # ログ入力バリデーション
│   │   └── weekly-report.ts      # 週次通信リクエストバリデーション
│   │
│   └── middleware.ts             # Next.js ミドルウェア（認証ガード）
│
├── supabase/                     # Supabase ローカル設定
│   ├── config.toml               # Supabase CLI設定
│   └── migrations/               # DBマイグレーション
│       └── YYYYMMDDHHMMSS_initial.sql
│
└── __tests__/                    # テスト
    ├── components/
    │   ├── log/
    │   └── weekly/
    ├── lib/
    │   ├── date.test.ts
    │   └── weekly-report/
    └── api/
        └── weekly-report/
```

---

## 2. ディレクトリの役割

| ディレクトリ | 役割 |
|-------------|------|
| `src/app/` | Next.js App Router のページ・レイアウト・API |
| `src/app/(auth)/` | 認証系画面（ログイン・登録）。未認証ユーザー向けレイアウト |
| `src/app/(main)/` | メイン機能画面。認証済みユーザー向けレイアウト |
| `src/app/api/` | Route Handlers。サーバーサイドAPI |
| `src/components/ui/` | shadcn/ui のコンポーネント。直接編集しない |
| `src/components/log/` | ログ機能に関連するコンポーネント |
| `src/components/weekly/` | 週次通信機能に関連するコンポーネント |
| `src/components/layout/` | ヘッダー・ナビなどレイアウト部品 |
| `src/lib/` | ビジネスロジック・外部サービスクライアント・ユーティリティ |
| `src/hooks/` | React カスタムフック |
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
