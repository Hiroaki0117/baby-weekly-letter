# 設計: 過去の振り返り（○年前の今日）

## 変更ファイル一覧

### 新規作成

| ファイル | 説明 |
|---------|------|
| `src/components/memory/memories-section.tsx` | ○年前の今日セクション（カード一覧） |
| `src/components/memory/memory-card.tsx` | 個別の振り返りカード（写真 + ログ情報） |
| `src/lib/memories.ts` | 過去の同日ログ取得・年別グルーピングユーティリティ |
| `__tests__/lib/memories.test.ts` | ユーティリティのテスト |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/page.tsx` | 日付カードとフォームの間に MemoriesSection を追加 |

## データ取得

```typescript
// 過去の同月同日のログを取得（1年以上前）
// 例: 今日が 2026-02-25 の場合
// log_date が "%-02-25" にマッチ かつ log_date < "2026-02-25" のログ

// Supabase では日付の部分一致が難しいため、
// 年ごとに候補日を生成してクエリする方式を採用
const today = new Date();
const todayStr = toDateString(today); // "2026-02-25"
const monthDay = todayStr.slice(5);    // "02-25"

// 過去5年分の候補日を生成（十分な範囲）
const candidateDates: string[] = [];
for (let y = 1; y <= 5; y++) {
  const pastYear = today.getFullYear() - y;
  const candidate = `${pastYear}-${monthDay}`;
  candidateDates.push(candidate);
}

// IN句でまとめて取得
const { data } = await supabase
  .from("daily_logs")
  .select("*")
  .in("log_date", candidateDates)
  .order("log_date", { ascending: false })
  .order("created_at", { ascending: false });
```

## ユーティリティ（memories.ts）

```typescript
type YearGroup = {
  yearsAgo: number;       // 何年前か（1, 2, 3...）
  label: string;          // "1年前の今日"
  date: string;           // "2025-02-25"
  dateLabel: string;      // "2025年2月25日"
  logs: DailyLog[];
};

function groupMemoriesByYear(
  logs: DailyLog[],
  today: Date
): YearGroup[];
```

- ログを年ごとにグルーピング
- `yearsAgo` の昇順（1年前 → 2年前 → ...）
- テスト可能な純粋関数

## コンポーネント設計

### MemoriesSection

- ホーム画面に配置するラッパーコンポーネント
- データ取得 + ローディング状態管理
- YearGroup ごとに年ラベル + MemoryCard を表示
- データがない場合は何も表示しない（非表示）

### MemoryCard

- 写真（ある場合）: カード上部に幅いっぱいで表示（角丸、object-cover）
- テキスト: 本文（line-clamp-3 で最大3行）
- 気分スタンプ
- カテゴリバッジ
- 子供バッジ（複数子供時のみ）

```
┌─────────────────────────────────┐
│  🕰 1年前の今日                  │
│  2025年2月25日                   │
│                                  │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │        写真（大きく）       │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  🥰 初めて寝返りをした！         │
│  嬉しそうにニコニコしてた…       │
│  [成長] [運動]                   │
│                                  │
│  ┌───────────────────────────┐  │
│  │  🙂 お昼寝をたくさんした     │  │
│  │  [睡眠]                      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
│                                  │
│  🕰 2年前の今日                  │
│  2024年2月25日                   │
│  ...                             │
```

## ホーム画面への配置

```tsx
// page.tsx の構成（変更後）
<div className="space-y-6">
  {/* 日付カード */}
  <DateCard ... />

  {/* ○年前の今日（該当あれば表示） */}
  <MemoriesSection
    childrenList={childrenList}
  />

  {/* ログフォーム */}
  <LogForm ... />

  {/* 今日のログ一覧 */}
  ...
</div>
```

## 実装順序

| Phase | 内容 |
|-------|------|
| 1 | `memories.ts` ユーティリティ作成 + テスト |
| 2 | `memory-card.tsx` コンポーネント作成 |
| 3 | `memories-section.tsx` コンポーネント作成（データ取得含む） |
| 4 | `page.tsx` に MemoriesSection を組み込み |
| 5 | 品質チェック + commit & push |
