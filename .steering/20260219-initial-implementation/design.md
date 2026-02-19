# 初回実装 - 実装設計

## 1. 実装アプローチ

段階的に実装を進める。各段階で動作確認が可能な状態を維持する。

1. **環境セットアップ** - Next.js プロジェクト初期化、各種ライブラリ導入
2. **Supabase セットアップ** - DB テーブル作成、RLS設定、Storage設定
3. **認証機能** - サインアップ・ログイン・ログアウト・認証ガード
4. **日次ログ機能** - 入力フォーム・一覧・編集・削除・写真アップロード
5. **週次通信機能** - 生成API・一覧・詳細表示・写真表示
6. **仕上げ** - レスポンシブ調整、エラーハンドリング、品質チェック

---

## 2. 環境セットアップ

### 2.1 Next.js プロジェクト初期化

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

### 2.2 追加パッケージ

```bash
# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# フォーム・バリデーション
pnpm add react-hook-form @hookform/resolvers zod

# 日付
pnpm add date-fns

# Gemini
pnpm add @google/generative-ai

# shadcn/ui 初期化
pnpm dlx shadcn@latest init
```

### 2.3 shadcn/ui コンポーネント

```bash
pnpm dlx shadcn@latest add button card input textarea badge toast label
```

### 2.4 環境変数（.env.local）

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

---

## 3. Supabase セットアップ

### 3.1 テーブル作成 SQL

```sql
-- daily_logs
CREATE TABLE daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  text text NOT NULL,
  mood text NOT NULL CHECK (mood IN ('happy', 'neutral', 'sad')),
  categories text[] DEFAULT '{}',
  photo_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date);

-- weekly_reports
CREATE TABLE weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  content text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source_log_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_reports_user_week ON weekly_reports(user_id, week_start);
```

### 3.2 RLS ポリシー

```sql
-- daily_logs RLS
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_logs ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_logs ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_logs ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_logs ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);

-- weekly_reports RLS
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_reports ON weekly_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_reports ON weekly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_reports ON weekly_reports
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3.3 updated_at 自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.4 Storage 設定

- バケット `log-photos` を作成（公開: false）
- ポリシー: `logs/{auth.uid()}/` 配下のみ読み書き可能

```sql
-- Storage ポリシー（Supabase ダッシュボードまたはSQL）
CREATE POLICY storage_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY storage_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY storage_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
```

---

## 4. 認証機能の設計

### 4.1 Supabase Client 構成

| ファイル | 用途 |
|---------|------|
| `lib/supabase/client.ts` | ブラウザ用クライアント（`createBrowserClient`） |
| `lib/supabase/server.ts` | サーバー用クライアント（`createServerClient`） |
| `middleware.ts` | セッションリフレッシュ・認証ガード |

### 4.2 ミドルウェアのルーティング

```
未認証ユーザー:
  /login, /signup → アクセス可
  それ以外 → /login へリダイレクト

認証済みユーザー:
  /login, /signup → / へリダイレクト
  それ以外 → アクセス可
```

### 4.3 OAuth コールバック

- `app/auth/callback/route.ts` で認証コードをセッションに交換
- 成功後 `/` へリダイレクト

---

## 5. 日次ログ機能の設計

### 5.1 ログ入力フォーム（LogForm）

| 要素 | コンポーネント | バリデーション |
|------|---------------|---------------|
| フリーテキスト | Textarea（shadcn/ui） | 必須、1〜2000文字 |
| 気分スタンプ | MoodSelector（カスタム） | 必須、3択から1つ |
| カテゴリ | CategoryPicker（カスタム） | 任意、0個以上 |
| 写真 | PhotoUploader（カスタム） | 任意、1枚、5MB以下、JPEG/PNG/WebP |

### 5.2 写真アップロードフロー

```
1. ユーザーがファイルを選択
2. クライアント側でファイルタイプ・サイズをバリデーション
3. ログ保存時に以下を実行:
   a. daily_logs にレコード INSERT → id を取得
   b. Storage に `logs/{userId}/{logId}/{filename}` でアップロード
   c. daily_logs の photo_storage_path を UPDATE
```

### 5.3 ホーム画面の構成

```
┌─────────────────────┐
│ LogForm（入力）      │
├─────────────────────┤
│ 今日のログ一覧       │
│ ├ LogCard           │
│ ├ LogCard           │
│ └ LogCard           │
└─────────────────────┘
```

- ログ保存後、一覧を再取得して即座に反映
- LogCard タップで編集モード（LogForm を編集用に再利用）

### 5.4 ログ一覧画面

- 日付の降順で表示
- 無限スクロールは MVP では不要（全件取得、ページングなし）
- 各カードに気分スタンプ、テキスト冒頭、カテゴリバッジを表示

---

## 6. 週次通信機能の設計

### 6.1 生成 API（POST /api/weekly-report/generate）

```
リクエスト受信
  ↓
認証チェック（Supabase セッション検証）
  ↓
weekStart / weekEnd バリデーション（Zod）
  ↓
対象期間のログを取得
  ↓
ログ0件 → 400エラー
  ↓
プロンプト構築（prompt.ts）
  ↓
Gemini API 呼び出し
  ↓
weekly_reports に upsert
  ↓
レスポンス返却
```

### 6.2 プロンプト設計

`lib/weekly-report/prompt.ts` にプロンプトテンプレートを定義する。

プロンプトに含める情報:
- 出力フォーマット（固定テンプレート）
- 対象期間
- 各ログの日付・テキスト・気分・カテゴリ
- 生成ルール（嘘を書かない、文字数350〜500字、やさしい文体）

### 6.3 週次通信詳細画面

```
┌────────────────────────┐
│ 通信本文（content）     │
├────────────────────────┤
│ この週の写真            │
│ PhotoGallery            │
├────────────────────────┤
│ [再生成する] ボタン     │
└────────────────────────┘
```

- 写真は対象期間のログから `photo_storage_path` が存在するものを抽出
- 写真の signed URL を取得して表示

### 6.4 週の計算ロジック（lib/date.ts）

```typescript
// date-fns を使用
import { startOfWeek, endOfWeek } from "date-fns";

// 月曜始まりの週を計算
function getWeekRange(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // 月曜
    end: endOfWeek(date, { weekStartsOn: 1 }),      // 日曜
  };
}
```

---

## 7. レイアウト設計

### 7.1 メインレイアウト（(main)/layout.tsx）

```
┌─────────────────────────────┐
│ Header                      │
│ [すくすく日記] [ログ] [通信] │
├─────────────────────────────┤
│                             │
│ {children}                  │
│                             │
└─────────────────────────────┘
```

- ヘッダーにアプリ名とナビゲーションリンク
- モバイル: ナビはアイコンのみ
- PC: ナビはテキスト付き

### 7.2 認証レイアウト（(auth)/layout.tsx）

- ヘッダーなし
- 中央揃えのカードレイアウト

---

## 8. 影響範囲

初回実装のため、既存コードへの影響なし。全てのファイルを新規作成する。

---

## 9. 考慮事項

### 9.1 Supabase 型生成

Supabase CLI で DB の型定義を自動生成する:

```bash
pnpm supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

### 9.2 エラーハンドリング

- フォームバリデーションエラー: フォーム上にインラインで表示
- API/DBエラー: トースト通知（shadcn/ui の toast）
- LLM生成エラー: 「生成に失敗しました。再度お試しください」

### 9.3 ローディング状態

- ログ保存中: ボタンをローディング状態に
- 週次通信生成中: ボタンをローディング状態 + 「生成中...」テキスト表示
- 画面初期読み込み: スケルトン表示（MVP ではシンプルなスピナーでも可）
