# 年次アルバム自動生成 - 設計

## 実装アプローチ

既存の月次まとめ生成パターン（Route Handler → Gemini → upsert）を踏襲し、年次アルバム用の API・UI・エクスポート機能を追加する。通信タブに「年次」小タブを追加して、生成・閲覧・PDFダウンロードの導線を提供する。

## データモデル

### `annual_reports` テーブル（新規）

| カラム | 型 | NULL | デフォルト | 備考 |
|--------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| family_id | uuid | NOT NULL | | FK → families |
| child_id | uuid | NOT NULL | | FK → children |
| fiscal_year | integer | NOT NULL | | 年度（例: 2025 = 2025年4月〜2026年3月） |
| content | jsonb | NOT NULL | | 生成結果（構造化データ） |
| generated_at | timestamptz | NOT NULL | now() | 生成日時（クールダウン判定用） |
| created_at | timestamptz | NOT NULL | now() | |

- ユニーク制約: `(family_id, child_id, fiscal_year)`
- RLS: `children` JOIN で `family_id = my_family_id()`

### `content` カラムの構造（JSONB）

```ts
type AnnualReportContent = {
  coverTitle: string;          // 表紙タイトル（例: "2025年度 たろうの記録"）
  childAge: string;            // 年度開始時の年齢（例: "1歳"）
  monthHighlights: {           // 月ごとのハイライト（最大12件）
    month: number;             // 月（4〜3）
    text: string;              // ハイライト文（AI生成、1〜2文）
    photoUrl: string | null;   // 月の代表写真URL（Storage signed URL）
  }[];
  milestones: {                // マイルストーンまとめ
    title: string;
    date: string;              // YYYY-MM-DD
    category: string;
  }[];
  growthSummary: {             // 成長データサマリー
    startHeight: number | null;
    endHeight: number | null;
    startWeight: number | null;
    endWeight: number | null;
  } | null;
  closingMessage: string;      // 1年の総括メッセージ（AI生成、3〜5文）
};
```

**注意**: `photoUrl` はPDF生成時にオンデマンドで Supabase signed URL を取得する。DB には `photo_storage_path` を保存する。

## 変更するコンポーネント・ファイル

### 新規作成

| ファイル | 用途 |
|----------|------|
| `src/schemas/annual-report.ts` | Zodスキーマ（API入力バリデーション） |
| `src/lib/annual-report/generate.ts` | Gemini呼び出しラッパー |
| `src/lib/annual-report/prompt.ts` | プロンプト構築 |
| `src/lib/annual-report/data.ts` | 年度データ収集ユーティリティ |
| `src/app/api/annual-report/generate/route.ts` | 年次アルバム生成API |
| `src/components/annual/annual-report-card.tsx` | 年次アルバム一覧カード |
| `src/components/annual/annual-album-view.tsx` | アルバム閲覧ビュー |
| `src/components/export/annual-export-layout.tsx` | PDF出力用レイアウト |

### 変更

| ファイル | 変更内容 |
|----------|----------|
| `src/components/log/logs-tabs.tsx` | `LogsTab` 型に `"annual"` を追加、年次タブ表示 |
| `src/app/(main)/logs/page.tsx` | 年次タブのコンテンツ追加（データ取得・表示・生成） |
| `src/types/index.ts` | `AnnualReport` 型を追加 |
| `docs/functional-design.md` | `annual_reports` テーブルをER図・テーブル詳細に追加 |

## 詳細設計

### 1. API: `POST /api/annual-report/generate`

既存の月次まとめAPIパターンを踏襲。

**リクエスト:**
```json
{
  "fiscalYear": 2025,
  "childId": "uuid"
}
```

**処理フロー:**

1. 認証チェック → 家族ID取得
2. バリデーション（Zodスキーマ）
3. 生成可能時期チェック（対象年度の3月1日以降か）
4. クールダウンチェック（既存レポートの `generated_at` から24時間以内は拒否）
5. データ収集:
   - 子供情報（名前、生年月日）
   - 対象年度の月次まとめ（最大12件）
   - 対象年度の週次通信（月次まとめがない月のフォールバック）
   - 対象年度のマイルストーン
   - 対象年度の成長データ（年度開始時点・終了時点に最も近い記録）
   - 各月の代表写真パス（各月の最新写真の `photo_storage_path`）
6. Gemini API 呼び出し（月ハイライト文 + 総括メッセージを生成）
7. レスポンスをパースし `AnnualReportContent` 構造に整形
8. `annual_reports` に upsert（`family_id, child_id, fiscal_year` で上書き）
9. 結果を返却

**エラーレスポンス:**
- 生成時期外: `{ error: "2025年度のアルバムは2026年3月以降に生成できます" }`
- クールダウン中: `{ error: "再生成は○時間後に可能です" }`
- データなし: `{ error: "対象年度の記録がありません" }`

### 2. データ収集ユーティリティ: `src/lib/annual-report/data.ts`

```ts
// 年度の開始・終了日を計算
function getFiscalYearRange(fiscalYear: number): { start: string; end: string }
// → { start: "2025-04-01", end: "2026-03-31" }

// 各月の代表写真パスを取得（各月の最新写真）
async function getMonthlyPhotoPaths(supabase, childId, fiscalYear): Promise<Map<number, string>>

// 成長データサマリーを取得
async function getGrowthSummary(supabase, childId, fiscalYear): Promise<GrowthSummary | null>

// 生成可能かどうかの判定
function canGenerate(fiscalYear: number): boolean
// → 現在日 >= 対象年度の3月1日

// クールダウン判定
function isInCooldown(generatedAt: string): boolean
// → generated_at から24時間以内なら true
```

### 3. プロンプト: `src/lib/annual-report/prompt.ts`

入力データ（月次まとめ・週次通信・マイルストーン・成長データ）をまとめてプロンプトを構築。

**出力指示:**
- JSON形式で出力させる（`monthHighlights` 配列 + `closingMessage`）
- 各月のハイライト文は1〜2文、30〜60字程度
- 総括メッセージは3〜5文、感動的な締め
- 通信カスタマイズのトーン設定を反映

### 4. タブ拡張: `logs-tabs.tsx`

- `LogsTab` 型に `"annual"` を追加
- `reportTabs` 配列に `{ key: "annual", label: "年次", icon: "📚" }` を追加
- `getTopCategory` は既存ロジックのまま（`"annual"` は `"reports"` カテゴリ）

### 5. アルバム閲覧ビュー: `annual-album-view.tsx`

アプリ内でアルバムのコンテンツを表示するビュー。

- 表紙セクション（子供名・年度・年齢）
- 月ごとのセクション（ハイライト文 + 写真）
- マイルストーンリスト
- 成長データサマリー
- 総括メッセージ
- PDFダウンロードボタン（`ShareMenu` コンポーネント再利用）

### 6. PDF出力: `annual-export-layout.tsx`

既存の `ExportLayout` パターンを踏襲した複数ページ対応のレイアウト。

- `forwardRef` で DOM 要素を参照
- 表紙ページ + 月別ページ（2ヶ月/ページで6ページ程度）+ マイルストーン・成長・総括ページ
- A4縦レイアウト、800px固定幅
- `html-to-image` + `jsPDF` で複数ページPDFを生成

### 7. 写真のURL取得

- DB保存時は `photo_storage_path` を保存
- 表示・PDF生成時に Supabase Storage の signed URL をオンデマンド取得
- 既存の `fetchPhotoUrls` パターンを参考に実装

## 影響範囲

- **既存機能への影響**: タブ追加のみ。既存のログ・週次・月次タブの動作は変わらない
- **新規テーブル**: `annual_reports` を追加（Supabase SQL で作成）
- **API**: 新規 Route Handler 1本追加
- **テスト**: 年度計算ユーティリティ、クールダウン判定ロジックのテストを追加
