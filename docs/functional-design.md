# 機能設計書

## 1. システム構成図

```mermaid
graph TB
    User[ユーザー<br/>PC / スマホ]

    subgraph Vercel
        NextJS[Next.js<br/>App Router]
        RouteHandlers[Route Handlers<br/>API]
    end

    subgraph Supabase
        Auth[Auth<br/>認証]
        DB[(PostgreSQL<br/>Database)]
        Storage[Storage<br/>写真保存]
    end

    Gemini[Google Gemini<br/>2.0 Flash]

    User -->|アクセス| NextJS
    NextJS -->|認証| Auth
    NextJS -->|データ取得・保存| DB
    NextJS -->|写真アップロード・取得| Storage
    User -->|週次通信生成リクエスト| RouteHandlers
    RouteHandlers -->|ログ取得| DB
    RouteHandlers -->|文章生成| Gemini
    RouteHandlers -->|通信保存| DB
```

---

## 2. データモデル定義

### 2.1 ER図

```mermaid
erDiagram
    families ||--o{ family_members : "has many"
    families ||--o{ children : "has many"
    children ||--o{ daily_logs : "has many"
    children ||--o{ weekly_reports : "has many"
    children ||--o{ monthly_reports : "has many"
    daily_logs }o--o| weekly_reports : "source_log_ids"

    families {
        uuid id PK
        text name
        timestamptz created_at
    }

    family_members {
        uuid id PK
        uuid family_id FK
        uuid user_id FK
        text role
        text display_name
        timestamptz joined_at
    }

    children {
        uuid id PK
        uuid family_id FK
        text name
        date birth_date
        timestamptz created_at
        timestamptz updated_at
    }

    daily_logs {
        uuid id PK
        uuid family_id FK
        uuid child_id FK
        uuid author_id FK
        date log_date
        text text
        text mood
        text[] categories
        text photo_storage_path
        timestamptz created_at
        timestamptz updated_at
    }

    weekly_reports {
        uuid id PK
        uuid family_id FK
        uuid child_id FK
        date week_start
        date week_end
        text content
        timestamptz generated_at
        uuid[] source_log_ids
        timestamptz created_at
    }

    monthly_reports {
        uuid id PK
        uuid family_id FK
        uuid child_id FK
        date month
        text content
        timestamptz generated_at
        uuid[] source_weekly_report_ids
        timestamptz created_at
    }
```

### 2.2 テーブル詳細

#### children

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| family_id | uuid | NOT NULL | | FK → families |
| name | text | NULL | | 子供の名前 |
| birth_date | date | NULL | | 生年月日 |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- インデックス: (family_id)
- RLS: family_id がユーザーの所属する家族と一致

#### daily_logs

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| family_id | uuid | NOT NULL | | FK → families |
| child_id | uuid | NOT NULL | | FK → children（対象の子供） |
| author_id | uuid | NOT NULL | auth.uid() | FK → auth.users |
| log_date | date | NOT NULL | CURRENT_DATE | ログ対象日 |
| text | text | NOT NULL | | フリーテキスト |
| mood | text | NOT NULL | | moved / happy / neutral / tired / sad |
| categories | text[] | NULL | '{}' | カテゴリ配列 |
| photo_storage_path | text | NULL | | Storage上のパス |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- インデックス: (family_id, log_date), (child_id)
- RLS: family_id がユーザーの所属する家族と一致

#### weekly_reports

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| family_id | uuid | NOT NULL | | FK → families |
| child_id | uuid | NOT NULL | | FK → children（対象の子供） |
| week_start | date | NOT NULL | | 月曜日 |
| week_end | date | NOT NULL | | 日曜日 |
| content | text | NOT NULL | | 生成された通信本文 |
| generated_at | timestamptz | NOT NULL | now() | 生成日時 |
| source_log_ids | uuid[] | NULL | '{}' | 元ログID配列 |
| created_at | timestamptz | NOT NULL | now() | |

- ユニーク制約: (family_id, child_id, week_start)
- インデックス: (family_id, child_id, week_start)
- RLS: family_id がユーザーの所属する家族と一致

#### monthly_reports

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| family_id | uuid | NOT NULL | | FK → families |
| child_id | uuid | NOT NULL | | FK → children（対象の子供） |
| month | date | NOT NULL | | 対象月 |
| content | text | NOT NULL | | 生成された月次まとめ本文 |
| generated_at | timestamptz | NOT NULL | now() | 生成日時 |
| source_weekly_report_ids | uuid[] | NULL | '{}' | 元週次通信ID配列 |
| created_at | timestamptz | NOT NULL | now() | |

- ユニーク制約: (family_id, child_id, month)
- RLS: family_id がユーザーの所属する家族と一致

---

## 3. RLS（Row Level Security）ポリシー

### daily_logs

| 操作 | ポリシー名 | 条件 |
|------|-----------|------|
| SELECT | select_own_logs | user_id = auth.uid() |
| INSERT | insert_own_logs | user_id = auth.uid() |
| UPDATE | update_own_logs | user_id = auth.uid() |
| DELETE | delete_own_logs | user_id = auth.uid() |

### weekly_reports

| 操作 | ポリシー名 | 条件 |
|------|-----------|------|
| SELECT | select_own_reports | user_id = auth.uid() |
| INSERT | insert_own_reports | user_id = auth.uid() |
| UPDATE | update_own_reports | user_id = auth.uid() |

### Storage (log-photos バケット)

| 操作 | 条件 |
|------|------|
| SELECT | パスが `logs/{auth.uid()}/` で始まる |
| INSERT | パスが `logs/{auth.uid()}/` で始まる |
| DELETE | パスが `logs/{auth.uid()}/` で始まる |

---

## 4. API設計

### 4.1 日次ログ API（Supabase Client 直接操作）

クライアントから Supabase Client SDK を使って直接操作する。Route Handlers は使用しない。

| 操作 | メソッド | 対象テーブル |
|------|---------|-------------|
| ログ作成 | supabase.from('daily_logs').insert() | daily_logs |
| ログ一覧取得 | supabase.from('daily_logs').select().eq('log_date', date) | daily_logs |
| ログ更新 | supabase.from('daily_logs').update().eq('id', id) | daily_logs |
| ログ削除 | supabase.from('daily_logs').delete().eq('id', id) | daily_logs |

### 4.2 写真 API（Supabase Client 直接操作）

| 操作 | メソッド |
|------|---------|
| アップロード | supabase.storage.from('log-photos').upload(path, file) |
| URL取得 | supabase.storage.from('log-photos').getPublicUrl(path) |
| 削除 | supabase.storage.from('log-photos').remove([path]) |

### 4.3 週次通信 API（Route Handlers）

#### POST /api/weekly-report/generate

週次通信を生成する。

**リクエスト:**

```json
{
  "childId": "uuid",
  "weekStart": "2026-02-16",
  "weekEnd": "2026-02-22"
}
```

**処理フロー:**

1. 認証チェック（Supabase Auth セッション検証）
2. 指定された child_id の対象期間のログを取得
3. ログが0件の場合はエラーを返す
4. Gemini API にプロンプト + ログデータを送信
5. 生成結果を weekly_reports に upsert（child_id + week_start で上書き）
6. 生成結果を返す

**レスポンス（成功）:**

```json
{
  "id": "uuid",
  "weekStart": "2026-02-16",
  "weekEnd": "2026-02-22",
  "content": "📮 今週のすくすく日記（2026/02/16〜2026/02/22）...",
  "generatedAt": "2026-02-22T21:00:00Z"
}
```

**レスポンス（エラー）:**

```json
{
  "error": "対象期間のログがありません"
}
```

#### GET /api/weekly-report

週次通信の一覧・個別取得はSupabase Client で直接操作する。

| 操作 | メソッド |
|------|---------|
| 一覧取得 | supabase.from('weekly_reports').select().order('week_start', { ascending: false }) |
| 個別取得 | supabase.from('weekly_reports').select().eq('id', id).single() |

---

## 5. 画面遷移図

```mermaid
graph TD
    Login[ログイン画面] -->|認証成功| Home

    Home[ホーム<br/>今日のログ入力] -->|ログ一覧を見る| LogList[ログ一覧画面]
    Home -->|週次通信を見る| WeeklyList[週次通信一覧画面]

    LogList -->|日付タップ| LogDetail[ログ詳細・編集画面]
    LogDetail -->|保存| LogList

    WeeklyList -->|週タップ| WeeklyDetail[週次通信詳細画面]
    WeeklyDetail -->|再生成| WeeklyDetail

    Home -->|通信を作る| WeeklyDetail
```

---

## 6. 画面設計（ワイヤフレーム）

### 6.1 ログイン画面

```
┌─────────────────────────────┐
│                             │
│       すくすく日記           │
│                             │
│  ┌───────────────────────┐  │
│  │ メールアドレス         │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ パスワード             │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │    ログイン            │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  G  Googleでログイン   │  │
│  └───────────────────────┘  │
│                             │
│  アカウント登録はこちら      │
│                             │
└─────────────────────────────┘
```

### 6.2 ホーム画面（今日のログ入力）

```
┌─────────────────────────────┐
│ すくすく日記    [ログ] [通信] │
├─────────────────────────────┤
│                             │
│ 📅 2026年2月18日（水）       │
│                             │
│ 今日の気分                   │
│ [🙂] [😐] [😭]              │
│                             │
│ 今日の出来事                 │
│ ┌───────────────────────┐   │
│ │                       │   │
│ │                       │   │
│ │                       │   │
│ └───────────────────────┘   │
│                             │
│ カテゴリ                     │
│ [食事] [睡眠] [遊び] [ことば]│
│ [運動] [体調] [成長] [気持ち]│
│                             │
│ 写真                        │
│ [📷 写真を追加]              │
│                             │
│ ┌───────────────────────┐   │
│ │       保存する          │   │
│ └───────────────────────┘   │
│                             │
│ ── 今日のログ ──            │
│ ┌───────────────────────┐   │
│ │ 🙂 離乳食をよく食べた… │   │
│ └───────────────────────┘   │
│                             │
└─────────────────────────────┘
```

### 6.3 ログ一覧画面

```
┌─────────────────────────────┐
│ ← ログ一覧                  │
├─────────────────────────────┤
│                             │
│ 2026年2月                   │
│                             │
│ ┌───────────────────────┐   │
│ │ 2/18（水） 🙂          │   │
│ │ 離乳食をよく食べた…    │   │
│ │ [食事] [成長]          │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 2/17（火） 😐          │   │
│ │ 夜泣きがひどかった…    │   │
│ │ [睡眠] [体調]          │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 2/16（月） 🙂          │   │
│ │ 初めて「ママ」と言った… │   │
│ │ [ことば] [成長]        │   │
│ └───────────────────────┘   │
│                             │
│ ...                         │
│                             │
└─────────────────────────────┘
```

### 6.4 週次通信詳細画面

```
┌─────────────────────────────┐
│ ← 週次通信                  │
├─────────────────────────────┤
│                             │
│ 📮 今週のすくすく日記        │
│ 2026/02/10〜2026/02/16      │
│                             │
│ 今週は離乳食デビューの       │
│ 大きな一歩がありました…     │
│                             │
│ 🌱 成長のきざし              │
│ ・初めてスプーンを自分で…   │
│ ・寝返りが上手に…           │
│                             │
│ 😊 かわいかった瞬間          │
│ ・パパの顔を見て…           │
│                             │
│ 🫧 ちょっと大変だったこと    │
│ ・夜泣きが続いて…           │
│                             │
│ 🧡 パパ/ママのひとこと       │
│ 大変だけど、笑顔に救われる   │
│ 毎日です。                  │
│                             │
│ ── この週の写真 ──          │
│ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │ 📷  │ │ 📷  │ │ 📷  │   │
│ └─────┘ └─────┘ └─────┘   │
│                             │
│ ┌───────────────────────┐   │
│ │     再生成する          │   │
│ └───────────────────────┘   │
│                             │
└─────────────────────────────┘
```

### 6.5 週次通信一覧画面

```
┌─────────────────────────────┐
│ ← 週次通信一覧              │
├─────────────────────────────┤
│                             │
│ ┌───────────────────────┐   │
│ │ 📮 2/10〜2/16          │   │
│ │ 離乳食デビューの週…    │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 📮 2/3〜2/9            │   │
│ │ 寝返りマスターの週…    │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 📮 1/27〜2/2           │   │
│ │ 初めての笑い声の週…    │   │
│ └───────────────────────┘   │
│                             │
│ ...                         │
│                             │
└─────────────────────────────┘
```

---

## 7. コンポーネント設計

### 7.1 主要コンポーネント

```
app/
├── (auth)/
│   ├── login/page.tsx          # ログイン画面
│   └── signup/page.tsx         # アカウント登録画面
├── (main)/
│   ├── layout.tsx              # メインレイアウト（ヘッダー・ナビ）
│   ├── page.tsx                # ホーム（今日のログ入力）
│   ├── logs/
│   │   └── page.tsx            # ログ一覧画面
│   └── weekly/
│       ├── page.tsx            # 週次通信一覧画面
│       └── [id]/page.tsx       # 週次通信詳細画面
└── api/
    └── weekly-report/
        └── generate/route.ts   # 週次通信生成 API
```

### 7.2 共通コンポーネント

| コンポーネント | 用途 |
|---------------|------|
| MoodSelector | 気分スタンプ選択（🥰🙂😐😴😭） |
| CategoryPicker | カテゴリ複数選択 |
| PhotoUploader | 写真アップロード（プレビュー付き） |
| ChildSelector | 子供選択（複数子供時にフォーム上部に表示） |
| ChildBadge | 子供名バッジ（記録カードに表示） |
| LogCard | ログ一覧のカード表示 |
| WeeklyReportCard | 週次通信一覧のカード表示 |
| LogForm | ログ入力・編集フォーム |
| LogFilter | ログ絞り込み（気分・カテゴリ・テキスト・子供） |
| PhotoGallery | 写真一覧表示（週次通信詳細用） |

---

## 8. 週次通信生成フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant UI as フロントエンド
    participant API as Route Handler
    participant DB as Supabase DB
    participant LLM as Gemini API

    User->>UI: 「今週の通信を作る」ボタン押下
    UI->>API: POST /api/weekly-report/generate
    API->>DB: 対象週のログを取得
    DB-->>API: ログデータ

    alt ログが0件
        API-->>UI: エラー（ログなし）
        UI-->>User: エラーメッセージ表示
    else ログあり
        API->>LLM: プロンプト + ログデータ
        LLM-->>API: 生成テキスト
        API->>DB: weekly_reports に upsert
        DB-->>API: 保存完了
        API-->>UI: 生成結果
        UI-->>User: 週次通信を表示
    end
```

---

## 9. v2 機能設計（概要）

v2 で追加予定の機能の概要設計。各機能の詳細設計は実装時にステアリングドキュメントで定義する。

### 9.1 写真ギャラリー（優先度1）

記録に添付された写真を一覧で振り返れる専用ページ。

- **画面**: `/gallery` に新規ページを追加
- **表示形式**: 月別のグリッドレイアウト（3〜4列）
- **データソース**: `daily_logs` の `photo_storage_path` が存在するレコードを対象
- **操作**: 写真タップで拡大表示、該当ログへの導線
- **フィルター**: 月切り替え、子供切り替え（複数子供時）

### 9.2 過去の振り返り — ○年前の今日（優先度2）

ホーム画面に「○年前の今日」の記録を表示し、成長の実感と感動を提供する。

- **表示場所**: ホーム画面の日付カード下部、またはログ一覧の上部
- **データソース**: `daily_logs` から過去の同月同日のレコードを取得
- **表示条件**: 1年以上前の同日にログが存在する場合のみ表示
- **表示内容**: テキスト・気分・写真（あれば）をカード形式で表示
- **複数年**: 1年前、2年前…と複数年分がある場合はすべて表示

### 9.3 成長グラフ / 統計ダッシュボード（優先度3）

記録データを可視化し、育児の傾向と成長を実感できるダッシュボード。

- **画面**: `/stats` に新規ページを追加
- **グラフ種類**:
  - 月別の記録数（棒グラフ）
  - 気分の推移（折れ線グラフ or 積み上げ棒グラフ）
  - カテゴリ別の記録割合（円グラフ or 横棒グラフ）
- **期間**: 月単位で切り替え、子供切り替え（複数子供時）
- **ライブラリ**: Recharts 等の軽量チャートライブラリを想定

### 9.4 家族間のリアクション（優先度4）

記録に対して家族メンバーがリアクション（スタンプ / コメント）を残せる機能。

- **リアクション種類**: スタンプ（いいね・ハート・笑い等、5〜6種）＋ 短文コメント
- **データモデル**: `log_reactions` テーブルを新規追加（log_id, user_id, type, comment）
- **表示**: LogCard の下部にリアクション一覧を表示
- **通知**: 将来的にリアクションがついたことをホーム画面で通知

### 9.5 通信のPDF / 画像エクスポート（優先度5）

週次・月次通信をPDFや画像としてエクスポートし、共有・印刷できる機能。

- **エクスポート形式**: PDF（A4縦）、画像（PNG）
- **生成方式**: サーバーサイドで html-to-pdf / html-to-image ライブラリを利用
- **UI**: 通信詳細画面に「エクスポート」ボタンを追加
- **レイアウト**: 通信本文 + その週の写真を含むプリント用レイアウト

### 9.6 テンプレート / クイック記録（将来検討）

よく使う記録パターンをワンタップで呼び出せる機能。v2 機能の実装後に検討する。

- **データモデル**: `log_templates` テーブル（family_id, label, icon, default_text, default_mood, default_categories, sort_order）
- **UI**: ホーム画面のフォーム上部にテンプレートボタン一覧を表示
- **設定**: 設定画面からテンプレートの追加・編集・削除・並び替え
- **デフォルト**: 初回登録時に5〜6個の汎用テンプレートをプリセット（ミルク、離乳食、お昼寝、おふろ等）
- **動作**: テンプレートタップでフォームにプリセット値を反映。ユーザーが編集してから保存も可能
