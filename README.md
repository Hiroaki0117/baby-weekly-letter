# すくすく日記（baby-weekly-letter）

日々の育児ログをかんたんに残し、週に1回 AI が「ちょい感動系」の**週次通信**を自動でつくる Web アプリです。
記録すること自体より「思い出が生まれること」を大事にしています。PC・スマホのブラウザだけで使えて、PWA としてホーム画面にも追加できます。

## 主な機能

### 記録する

- **日次ログ**: 本文・気分スタンプ・カテゴリ・写真 1 枚で記録。同じ日に何件でも残せます
- **音声入力**: マイクボタンで話した内容を文字にします（Web Speech API）。授乳中や寝かしつけ中でも記録できます
- **からだの記録**: 身長・体重（成長曲線つき）、体温、睡眠、食事をワンタップで記録
- **成長タイムライン**: 「初めて○○した」を時系列で表示。週次通信の生成時に AI が自動で拾い、手動での追加・編集もできます

### 振り返る

- **週次通信 / 月次まとめ / 年次アルバム**: Gemini がログから文章を生成します。文体（ほっこり系・ユーモア系・淡々記録系・ポエム系）とセクション構成は設定で変えられます
- **自動生成**: 週次は毎週日曜、月次は月末、年次は年度末（3/31）に自動で生成します
- **エクスポート**: 週次・月次は A4 の PDF か PNG 画像、年次アルバムは A4 の PDF で保存できます（祖父母への共有や印刷向け）
- **写真ギャラリー**: 添付した写真を月ごとのグリッドで一覧表示
- **○年前の今日**: 1 年以上前の同じ日の記録をホーム画面に表示
- **統計ダッシュボード**: 記録数・気分・カテゴリ・成長・体温・睡眠・食事をグラフで表示（週 / 月の切り替えつき）
- **カレンダー**: 月ごとの記録状況をひと目で確認

### 家族で使う

- **家族グループ**: 招待リンクで家族を招き、記録を共有。子どもは何人でも登録できます
- **リアクション・コメント**: 記録に 5 種類のスタンプ（❤️👏😊💪✨）や短いコメントを送れます
- **記録リマインダー**: その日の記録がないと 21 時（JST）に Web Push で通知します

## 技術スタック

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Next.js 16（App Router）/ React 19 / TypeScript 5 |
| UI | Tailwind CSS 4 / shadcn/ui（Radix UI）/ lucide-react / sonner |
| フォーム・検証 | React Hook Form / Zod 4 |
| グラフ・出力 | Recharts / html-to-image / jsPDF |
| バックエンド | Supabase（Auth / PostgreSQL + RLS / Storage）/ Next.js Route Handlers |
| AI | Google Gemini（既定は `gemini-3.8-flash`）/ `@google/generative-ai` |
| 通知 | Web Push（`web-push` + Service Worker） |
| ホスティング | Vercel（Vercel Cron）/ GitHub Actions |
| 開発ツール | pnpm / ESLint / Prettier / Vitest / Testing Library |

構成図や認証フローは [docs/architecture.md](docs/architecture.md) にあります。

## セットアップ

### 必要なもの

- Node.js 20 以上
- pnpm
- Supabase プロジェクト
- Google Gemini の API キー（[Google AI Studio](https://aistudio.google.com/) で発行）

### 1. 依存パッケージを入れる

```bash
pnpm install
```

### 2. Supabase を準備する

1. Supabase でプロジェクトを作ります
2. `supabase/migrations/` の SQL をファイル名順にすべて適用します。Supabase CLI を使う場合は次のとおりです

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   CLI を使わない場合は、SQL Editor で古いファイルから順に実行してください。写真用の Storage バケット `log-photos` も、このマイグレーションで作られます
3. Google ログインを使う場合は、Authentication → Providers で Google を有効にします。Authentication → URL Configuration の Redirect URLs には `http://localhost:3000/auth/callback`（本番では `https://<your-domain>/auth/callback`）を追加します

### 3. 環境変数を設定する

`.env.example` をコピーして `.env.local` を作り、値を入れます。

```bash
cp .env.example .env.local
```

| 変数名 | 必須 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase のプロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase の anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase の service role キー（サーバー側の cron 処理だけで使用） |
| `GEMINI_API_KEY` | ✅ | Gemini の API キー（サーバー側だけで使用） |
| `GEMINI_MODEL` | | 使う Gemini モデル。空なら `gemini-3.8-flash` |
| `CRON_SECRET` | 自動生成・通知を使う場合 | cron 用エンドポイントの Bearer トークン |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 通知を使う場合 | Web Push の VAPID 公開鍵 |
| `VAPID_PRIVATE_KEY` | 通知を使う場合 | Web Push の VAPID 秘密鍵 |
| `VAPID_SUBJECT` | | VAPID の連絡先（例: `mailto:you@example.com`） |

VAPID の鍵ペアは次のコマンドで作れます。

```bash
npx web-push generate-vapid-keys
```

`CRON_SECRET` には十分に長いランダムな文字列を使ってください（例: `openssl rand -hex 32`）。

### 4. 起動する

```bash
pnpm dev
```

ブラウザで <http://localhost:3000> を開き、アカウント登録 → オンボーディング（家族と子どもの登録）の順に進みます。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバーを起動（Turbopack） |
| `pnpm build` / `pnpm start` | 本番ビルド / 本番サーバーを起動 |
| `pnpm lint` / `pnpm lint:fix` | ESLint で検査 / 自動修正 |
| `pnpm format` / `pnpm format:check` | Prettier で整形 / 整形の確認 |
| `pnpm type-check` | TypeScript の型チェック |
| `pnpm test` / `pnpm test:coverage` | Vitest でテスト / カバレッジつきでテスト |

変更をコミットする前に、次の品質チェックを通してください。

```bash
pnpm lint && pnpm type-check && pnpm test
```

## デプロイ

Vercel へのデプロイを前提にしています。

1. リポジトリを Vercel にインポートし、上の表の環境変数を Production に登録します
2. Supabase の Redirect URLs に本番ドメインの `/auth/callback` を追加します

### 定期実行

| ジョブ | 実行元 | スケジュール | エンドポイント |
| --- | --- | --- | --- |
| 週次・月次・年次の自動生成 | Vercel Cron（`vercel.json`） | 毎日 19:00 JST | `GET /api/cron/auto-generate` |
| 記録リマインダー | GitHub Actions（`.github/workflows/send-reminders.yml`） | 毎日 21:00 JST | `POST /api/cron/send-reminders` |

- 自動生成は毎日動き、日曜なら週次、月末なら月次、3/31 なら年次を生成します。設定でオフにできます（家族全員がオフにした場合だけ、その家族の自動生成が止まります）
- どちらのエンドポイントも `Authorization: Bearer <CRON_SECRET>` で認証します。Vercel Cron は、Vercel に登録した `CRON_SECRET` を自動でヘッダーに付けます
- リマインダーを使う場合は、GitHub リポジトリの Secrets に `APP_URL`（例: `https://<your-domain>`）と `CRON_SECRET` を登録します

## ディレクトリ構成

```
.
├── src/
│   ├── app/            # App Router（(auth) 認証画面 / (main) メイン画面 / api Route Handlers）
│   ├── components/     # 機能ごとの UI コンポーネント（ui/ は shadcn/ui）
│   ├── hooks/          # カスタムフック
│   ├── lib/            # Supabase・Gemini・レポート生成・cron などのロジック
│   ├── schemas/        # Zod スキーマ
│   └── types/          # 型定義とドメイン定数
├── __tests__/          # Vitest のテスト（src/ と同じ構成）
├── supabase/migrations/# DB スキーマ・RLS・Storage のマイグレーション
├── public/             # PWA マニフェスト・Service Worker・アイコン
├── docs/               # 設計ドキュメント
└── .steering/          # 作業単位のステアリング資料
```

詳しくは [docs/repository-structure.md](docs/repository-structure.md) を参照してください。

## ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| [docs/product-requirements.md](docs/product-requirements.md) | プロダクト要求（目的・機能一覧・受け入れ条件） |
| [docs/functional-design.md](docs/functional-design.md) | 機能設計（画面・データモデル・API） |
| [docs/architecture.md](docs/architecture.md) | 技術仕様（構成・環境変数・セキュリティ） |
| [docs/repository-structure.md](docs/repository-structure.md) | リポジトリ構造 |
| [docs/development-guidelines.md](docs/development-guidelines.md) | 開発ガイドライン（コーディング・テスト・Git 規約） |
| [docs/glossary.md](docs/glossary.md) | 用語集 |
