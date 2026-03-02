# 週次通信カスタマイズ - 設計書

## 1. データモデル

### 1.1 新規テーブル: `report_preferences`

ユーザーごとの通信設定を保存するテーブル。

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | auth.users への FK（UNIQUE） |
| tone | text | NO | 'warm' | トーン設定 |
| sections | text[] | NO | '{highlight,digest,growth}' | ON にしたセクション |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**tone の値:**
| 値 | 表示名 |
|----|--------|
| `warm` | ほっこり系 |
| `humor` | ユーモア系 |
| `neutral` | 淡々記録系 |
| `poetic` | ポエム系 |

**sections の値:**
| 値 | 表示名 | デフォルト |
|----|--------|-----------|
| `highlight` | 今週のハイライト | ON |
| `digest` | 日々のダイジェスト | ON |
| `growth` | 成長メモ | ON |
| `encouragement` | 親へのひとこと | OFF |
| `quote` | 今週の名言 | OFF |

### 1.2 RLS ポリシー

- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`

自分の設定のみ読み書き可能。

### 1.3 マイグレーション

`supabase/migrations/20260302000000_create_report_preferences.sql`

## 2. 型定義

### 2.1 database.ts への追加

```typescript
report_preferences: {
  Row: {
    id: string;
    user_id: string;
    tone: string;
    sections: string[];
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    tone?: string;
    sections?: string[];
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    tone?: string;
    sections?: string[];
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
```

### 2.2 types/index.ts への追加

```typescript
export type ReportTone = "warm" | "humor" | "neutral" | "poetic";
export type ReportSection = "highlight" | "digest" | "growth" | "encouragement" | "quote";

export type ReportPreferences = {
  tone: ReportTone;
  sections: ReportSection[];
};
```

## 3. Zod スキーマ

`src/schemas/report-preferences.ts`

```typescript
export const reportPreferencesSchema = z.object({
  tone: z.enum(["warm", "humor", "neutral", "poetic"]),
  sections: z
    .array(z.enum(["highlight", "digest", "growth", "encouragement", "quote"]))
    .min(1, "セクションを最低1つ選択してください"),
});
```

## 4. CRUD 関数

`src/lib/report-preferences.ts`

| 関数 | 説明 |
|------|------|
| `fetchReportPreferences()` | 現在のユーザーの設定を取得。未保存なら `null` を返す |
| `upsertReportPreferences(tone, sections)` | 設定を保存（upsert） |

## 5. プロンプトへの反映

### 5.1 週次通信プロンプト (`src/lib/weekly-report/prompt.ts`)

`buildPrompt` の引数に `ReportPreferences` を追加し、以下の2箇所を動的に変更する。

#### トーンの反映

冒頭の役割説明と文体ガイドラインをトーンに応じて差し替える。

| トーン | 冒頭の役割 | 文体ガイドライン |
|--------|-----------|----------------|
| warm | 「温かみのある手紙」として紡ぐ（現状） | 現状のまま |
| humor | 「ユーモアを交えた楽しい手紙」として書く | 適度なユーモアや軽快な表現を交える。深刻になりすぎず明るい読後感。 |
| neutral | 「落ち着いた記録」としてまとめる | 客観的で簡潔な文体。感情表現は控えめに事実を中心に記述。 |
| poetic | 「詩的なエッセイ」として描く | 比喩や情景描写を豊かに。季節感や五感の描写を大切に。 |

#### セクション構成の反映

構成ガイドセクションを、ユーザーがONにしたセクションのみで構築する。

```
## 構成ガイド

以下のセクションを必ず含めて通信を構成してください。
各セクションには絵文字1つ+見出しテキストを付けてください。

- ✨ 今週のハイライト: 今週最も印象的なエピソードを1つ選び、深く掘り下げて書く
- 📅 日々のダイジェスト: 日ごとのハイライトを短く紡ぐ
- 🌱 成長メモ: 前回の通信と比較して見られる変化や成長を書く
```

### 5.2 月次通信プロンプト (`src/lib/monthly-report/prompt.ts`)

`buildMonthlyPrompt` にも同様に `ReportPreferences` を渡す。

- トーン: 冒頭の役割説明と文体ガイドラインを差し替え（週次と同じトーン定義）
- セクション構成: 月次は週次通信を再構成する形式のため、セクション名を月次向けに調整する
  - 今週のハイライト → 今月のハイライト
  - 日々のダイジェスト → 週ごとのダイジェスト
  - 成長メモ → 月間の成長
  - 親へのひとこと → 親へのひとこと（そのまま）
  - 今週の名言 → 今月の名言

### 5.3 生成関数の変更

`generateWeeklyReport` と `generateMonthlyReport` の引数に `ReportPreferences` を追加。
API ルートで生成実行前にユーザーの設定を取得し、渡す。

## 6. 設定UI

### 6.1 設定ページへの追加 (`src/app/(main)/settings/page.tsx`)

既存の「あなたの情報」セクションの下に「通信設定」セクションを追加する。

```
┌──────────────────────────────────┐
│ あなたの情報                       │
│  表示名: [________]               │
│  [保存する]                       │
├──────────────────────────────────┤
│ 通信設定                          │
│                                  │
│  文体トーン                       │
│  ○ ほっこり系   ○ ユーモア系      │
│  ○ 淡々記録系   ○ ポエム系        │
│                                  │
│  セクション構成                    │
│  ☑ 今週のハイライト               │
│  ☑ 日々のダイジェスト              │
│  ☑ 成長メモ                      │
│  ☐ 親へのひとこと                 │
│  ☐ 今週の名言                    │
│                                  │
│  [保存する]                       │
├──────────────────────────────────┤
│ ログアウト（モバイルのみ）          │
└──────────────────────────────────┘
```

### 6.2 コンポーネント

`src/components/settings/report-preferences-form.tsx`

- トーン: ラジオボタン形式（4択）
- セクション: チェックボックス形式（5項目、最低1つ必須）
- 保存ボタンで upsert
- 初回表示時にデフォルト値を表示

## 7. API ルートの変更

### 7.1 週次通信生成 (`src/app/api/weekly-report/generate/route.ts`)

生成処理の前に `fetchReportPreferences()` を呼び出し、取得した設定を `generateWeeklyReport` に渡す。

### 7.2 月次通信生成 (`src/app/api/monthly-report/generate/route.ts`)

同様に `fetchReportPreferences()` を呼び出し、設定を `generateMonthlyReport` に渡す。

## 8. デフォルト値の扱い

`report_preferences` レコードが存在しない場合（初回ユーザー）:

```typescript
const DEFAULT_PREFERENCES: ReportPreferences = {
  tone: "warm",
  sections: ["highlight", "digest", "growth"],
};
```

プロンプト組み立て時にこのデフォルト値を使用する。現状の通信と同じ品質が維持される。

## 9. 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `supabase/migrations/` | 新規マイグレーション追加 |
| `src/types/database.ts` | report_preferences テーブル型追加 |
| `src/types/index.ts` | ReportTone, ReportSection, ReportPreferences 型追加 |
| `src/schemas/report-preferences.ts` | 新規: Zod スキーマ |
| `src/lib/report-preferences.ts` | 新規: CRUD 関数 |
| `src/lib/weekly-report/prompt.ts` | トーン・セクション反映のプロンプト修正 |
| `src/lib/weekly-report/generate.ts` | 引数に ReportPreferences 追加 |
| `src/lib/monthly-report/prompt.ts` | トーン・セクション反映のプロンプト修正 |
| `src/lib/monthly-report/generate.ts` | 引数に ReportPreferences 追加 |
| `src/app/api/weekly-report/generate/route.ts` | 設定取得・反映 |
| `src/app/api/monthly-report/generate/route.ts` | 設定取得・反映 |
| `src/components/settings/report-preferences-form.tsx` | 新規: 設定フォームコンポーネント |
| `src/app/(main)/settings/page.tsx` | 通信設定セクション追加 |
