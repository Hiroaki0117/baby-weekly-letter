# 成長タイムライン - 設計書

## 1. データモデル

### milestones テーブル

```sql
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  title text not null,
  milestone_date date not null,
  category text not null default 'other',
  memo text,
  source text not null default 'manual',  -- 'ai' | 'manual'
  weekly_report_id uuid references weekly_reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestones_category_check check (category in ('motor', 'language', 'eating', 'lifestyle', 'other')),
  constraint milestones_source_check check (source in ('ai', 'manual'))
);

-- RLS: 家族メンバーのみアクセス可能
alter table milestones enable row level security;

create policy "milestones_select" on milestones for select
  using (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

create policy "milestones_insert" on milestones for insert
  with check (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

create policy "milestones_update" on milestones for update
  using (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

create policy "milestones_delete" on milestones for delete
  using (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

-- updated_at トリガー
create trigger milestones_updated_at
  before update on milestones
  for each row execute function update_updated_at();
```

### カラム説明

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| child_id | uuid | 子供FK |
| title | text | 「初めて寝返りした」等 |
| milestone_date | date | マイルストーン発生日 |
| category | text | motor/language/eating/lifestyle/other |
| memo | text | 補足メモ（AI抽出時は元ログの要約） |
| source | text | ai/manual |
| weekly_report_id | uuid | AI抽出元の週次通信（NULLable） |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

## 2. 型定義

### src/types/index.ts に追加

```typescript
export type MilestoneCategory = "motor" | "language" | "eating" | "lifestyle" | "other";
export type MilestoneSource = "ai" | "manual";

export type Milestone = {
  id: string;
  child_id: string;
  title: string;
  milestone_date: string;
  category: MilestoneCategory;
  memo: string | null;
  source: MilestoneSource;
  weekly_report_id: string | null;
  created_at: string;
  updated_at: string;
};

export const MILESTONE_CATEGORY_OPTIONS: {
  value: MilestoneCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: "motor", label: "運動", emoji: "🏃", color: "blue" },
  { value: "language", label: "ことば", emoji: "💬", color: "purple" },
  { value: "eating", label: "食事", emoji: "🍽️", color: "orange" },
  { value: "lifestyle", label: "生活習慣", emoji: "🌟", color: "green" },
  { value: "other", label: "その他", emoji: "📌", color: "gray" },
];
```

### src/types/database.ts に追加

milestones テーブルの Row/Insert/Update 型を追加。

## 3. Zodスキーマ

### src/schemas/milestone.ts（新規）

```typescript
export const milestoneSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(100),
  milestone_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(["motor", "language", "eating", "lifestyle", "other"]),
  memo: z.string().max(500).optional().or(z.literal("")),
});
```

## 4. AI自動抽出の設計

### 4-1. 抽出プロンプト（src/lib/milestones/extract-prompt.ts）

週次通信生成APIの中で、通信生成とは別にマイルストーン抽出用のプロンプトをGeminiに送る。

```
あなたは育児ログから成長マイルストーン（「初めて○○した」「○○ができるようになった」）を検出するアシスタントです。

以下の育児ログを読み、成長の節目と判断できるエピソードを抽出してください。

## 出力フォーマット
JSON配列で出力してください。該当なしの場合は空配列 [] を返してください。

[
  {
    "title": "初めて寝返りした",
    "date": "2026-02-18",
    "category": "motor",
    "memo": "右から左に寝返り成功"
  }
]

## カテゴリ
- motor: 運動（寝返り、ハイハイ、つかまり立ち等）
- language: ことば（初めての発語、二語文等）
- eating: 食事（離乳食開始、手づかみ食べ等）
- lifestyle: 生活習慣（着替え、トイレトレーニング等）
- other: その他

## 注意
- 明確に「初めて」や「できるようになった」と判断できるもののみ抽出
- 曖昧なものは抽出しない
- 日付はログの日付を使用する

## ログ
{logsText}
```

### 4-2. 抽出フロー（週次通信生成APIに組み込み）

```
POST /api/weekly-report/generate
  1. (既存) 週次通信を生成
  2. (追加) マイルストーン抽出プロンプトをGeminiに送信
  3. (追加) JSON応答をパース
  4. (追加) 重複チェック（同じchild_id + 類似日付 + 類似タイトル）
  5. (追加) 新規マイルストーンをDBに保存
  6. (追加) レスポンスに extractedMilestones を追加
```

### 4-3. 重複チェックロジック

- 同じ `child_id` の既存マイルストーンを取得
- `milestone_date` が前後7日以内 かつ `title` が類似（部分一致）の場合はスキップ
- 簡易的な文字列比較で十分（完全一致 or 一方が他方を含む）

## 5. CRUD関数（src/lib/milestones.ts）

```typescript
// 一覧取得（子供ID指定、新しい順）
fetchMilestones(supabase, childId): Promise<Milestone[]>

// 追加
createMilestone(supabase, data): Promise<Milestone>

// 更新
updateMilestone(supabase, id, data): Promise<Milestone>

// 削除
deleteMilestone(supabase, id): Promise<void>

// AI抽出結果を一括保存（重複チェック付き）
saveMilestones(supabase, childId, milestones[], weeklyReportId): Promise<{ saved: number; skipped: number }>
```

## 6. API設計

### マイルストーンCRUDはクライアント直接Supabase

手動追加・編集・削除はSupabaseクライアントから直接実行する（APIルート不要）。
RLSポリシーで家族メンバーのみにアクセスを制限する。

### 週次通信生成API拡張

`POST /api/weekly-report/generate` のレスポンスに `extractedMilestones` フィールドを追加：

```json
{
  "id": "...",
  "content": "...",
  "extractedMilestones": [
    { "title": "初めて寝返りした", "category": "motor" }
  ]
}
```

## 7. UIコンポーネント設計

### 7-1. 統計ページ成長タブの拡張

現在の成長タブ（成長曲線のみ）に、マイルストーンタイムラインセクションを追加する。

```
成長タブ
├── 成長曲線（GrowthChart）← 既存
└── マイルストーンタイムライン ← 新規
    ├── 追加ボタン
    ├── カテゴリフィルタ（チップ形式）
    └── タイムラインリスト
        └── MilestoneCard × N
```

### 7-2. コンポーネント一覧

| コンポーネント | パス | 説明 |
|--------------|------|------|
| MilestoneTimeline | src/components/milestone/milestone-timeline.tsx | タイムライン全体（フィルタ+リスト+追加ボタン） |
| MilestoneCard | src/components/milestone/milestone-card.tsx | 個別マイルストーン表示（編集・削除ボタン含む） |
| MilestoneForm | src/components/milestone/milestone-form.tsx | 追加・編集フォーム（ダイアログ or インライン） |
| MilestoneCategoryFilter | src/components/milestone/milestone-category-filter.tsx | カテゴリ絞り込みチップ |

### 7-3. MilestoneTimeline

- Props: `childId: string`
- マウント時に `fetchMilestones` で一覧取得
- カテゴリフィルタでクライアント側絞り込み
- 上部に「+ マイルストーンを追加」ボタン
- 空状態: 「まだマイルストーンがありません」

### 7-4. MilestoneCard

- カテゴリに応じた絵文字+カラーのアイコン
- タイトル、日付（○年○月○日）、カテゴリラベル
- メモ（あれば展開表示）
- ソースバッジ（AI / 手動）
- 編集・削除ボタン（三点メニューまたはスワイプ）

### 7-5. MilestoneForm

- ダイアログ形式（モーダル）
- React Hook Form + Zod バリデーション
- フィールド: タイトル（テキスト）、日付（date input）、カテゴリ（セレクト）、メモ（テキストエリア、任意）

### 7-6. 週次通信生成結果画面での通知

週次通信生成後、`extractedMilestones` が1件以上ある場合にトースト通知：
`🌟 {N}件の成長マイルストーンを検出しました`

## 8. 実装フェーズ

### Phase 1: DB + 型 + スキーマ
- マイグレーション作成
- types/index.ts に型追加
- types/database.ts に型追加
- schemas/milestone.ts 作成
- テスト作成

### Phase 2: CRUD関数
- src/lib/milestones.ts 作成
- saveMilestones（重複チェック付き一括保存）

### Phase 3: AI抽出
- src/lib/milestones/extract-prompt.ts 作成
- 週次通信生成API拡張（抽出 → 保存 → レスポンス追加）

### Phase 4: タイムラインUI
- MilestoneTimeline コンポーネント
- MilestoneCard コンポーネント
- MilestoneCategoryFilter コンポーネント
- 統計ページ成長タブに組み込み

### Phase 5: 追加・編集・削除UI
- MilestoneForm コンポーネント（ダイアログ）
- 追加フロー
- 編集フロー
- 削除フロー（確認ダイアログ付き）

### Phase 6: 通知連携
- 週次通信生成結果画面でマイルストーン通知表示
- トースト表示

### Phase 7: 品質チェック + 完了
- lint / type-check / test
- commit + push
