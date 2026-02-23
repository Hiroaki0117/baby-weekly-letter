# 開発ガイドライン

## 1. コーディング規約

### 1.1 一般原則

- 厳密な TypeScript を使用する（`strict: true`）
- `any` 型の使用を禁止する
- 未使用の変数・インポートは残さない
- `console.log` はデバッグ時のみ使用し、コミット前に削除する

### 1.2 関数・コンポーネント

- 関数コンポーネントとフックのみ使用する（クラスコンポーネントは使用しない）
- `export default` ではなく名前付きエクスポートを使用する
- Props の型は同一ファイル内にインラインで定義する

```tsx
// Good
type LogCardProps = {
  log: DailyLog;
  onEdit: (id: string) => void;
};

export function LogCard({ log, onEdit }: LogCardProps) {
  // ...
}
```

### 1.3 インポート順序

1. React / Next.js
2. 外部ライブラリ
3. 内部モジュール（`@/lib/`, `@/components/`, `@/hooks/`）
4. 型インポート

```tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { LogForm } from "@/components/log/log-form";
import { createClient } from "@/lib/supabase/client";

import type { DailyLog } from "@/types";
```

---

## 2. 命名規則

### 2.1 ファイル名

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | ケバブケース | `log-form.tsx` |
| ユーティリティ | ケバブケース | `date.ts` |
| フック | ケバブケース（use- プレフィックス） | `use-auth.ts` |
| スキーマ | ケバブケース | `log.ts` |
| 型定義 | ケバブケース | `database.ts` |
| テスト | `{対象}.test.ts(x)` | `date.test.ts` |

### 2.2 変数・関数名

| 対象 | 規則 | 例 |
|------|------|-----|
| 変数 | キャメルケース | `logDate`, `weekStart` |
| 関数 | キャメルケース | `formatDate()`, `generateReport()` |
| コンポーネント | パスカルケース | `LogCard`, `MoodSelector` |
| 型・インターフェース | パスカルケース | `DailyLog`, `WeeklyReport` |
| 定数 | アッパースネークケース | `MAX_PHOTO_SIZE`, `MOOD_OPTIONS` |
| Zodスキーマ | キャメルケース + Schema 接尾辞 | `logFormSchema`, `weeklyReportSchema` |

### 2.3 データベース

| 対象 | 規則 | 例 |
|------|------|-----|
| テーブル名 | スネークケース（複数形） | `daily_logs`, `weekly_reports` |
| カラム名 | スネークケース | `log_date`, `user_id`, `week_start` |
| インデックス名 | `idx_{テーブル}_{カラム}` | `idx_daily_logs_user_date` |

---

## 3. スタイリング規約

### 3.1 Tailwind CSS

- インラインで Tailwind クラスを記述する
- クラスが長くなる場合は `cn()` ユーティリティで整理する
- カスタムCSSは原則使用しない（Tailwindで表現できない場合のみ）

```tsx
// Good
<button className={cn(
  "rounded-lg px-4 py-2 font-medium",
  "bg-primary text-primary-foreground",
  "hover:bg-primary/90",
  disabled && "opacity-50 cursor-not-allowed"
)}>
  保存する
</button>
```

### 3.2 レスポンシブ

- モバイルファーストで記述する
- ブレークポイントは Tailwind のデフォルトを使用

```tsx
// Good: モバイルファースト
<div className="px-4 md:px-8 lg:px-12">
```

### 3.3 shadcn/ui

- shadcn/ui のコンポーネントは `src/components/ui/` に配置
- カスタマイズは Tailwind のクラス上書きで行う
- `components/ui/` 内のファイルは直接編集しない

---

## 4. テスト規約

### 4.1 テストフレームワーク

- Vitest を使用する
- React コンポーネントのテストには Testing Library を使用する

### 4.2 テスト作成ルール

**新機能実装時は、対応するテストコードも合わせて作成すること。**

- 新しいスキーマ（Zod）を追加した場合 → バリデーションテストを作成
- 新しいユーティリティ関数を追加した場合 → ユニットテストを作成
- 新しいヘルパー関数（Supabase連携等）を追加した場合 → モックを使用したテストを作成
- テストは実装と同じコミットに含めるか、実装直後のコミットで追加する

### 4.3 テスト対象

| 対象 | 優先度 | 理由 |
|------|--------|------|
| ユーティリティ関数（`lib/date.ts` 等） | 高 | 純粋関数でテストしやすい |
| Zodスキーマ | 高 | バリデーションの正確性を担保 |
| ヘルパー関数（`lib/supabase/` 等） | 高 | モックを使い動作を担保 |
| 週次通信生成ロジック | 中 | プロンプト構築の正確性 |
| コンポーネント | 低 | MVPでは手動テストで代替 |

### 4.4 テストファイルの配置

- `__tests__/` ディレクトリに `src/` と同じ構造で配置

```
__tests__/
├── lib/
│   ├── date.test.ts
│   ├── supabase/
│   │   └── family.test.ts
│   └── weekly-report/
│       └── prompt.test.ts
└── schemas/
    ├── log.test.ts
    ├── family.test.ts
    └── profile.test.ts
```

### 4.5 テストの書き方

```tsx
import { describe, it, expect } from "vitest";
import { getWeekRange } from "@/lib/date";

describe("getWeekRange", () => {
  it("指定日の月曜〜日曜を返す", () => {
    const result = getWeekRange(new Date("2026-02-18"));
    expect(result.start).toEqual(new Date("2026-02-16"));
    expect(result.end).toEqual(new Date("2026-02-22"));
  });
});
```

---

## 5. Git 規約

### 5.1 ブランチ戦略

- `main` ブランチ: 本番環境にデプロイされるブランチ
- `feature/{機能名}`: 機能開発ブランチ
- `fix/{バグ名}`: バグ修正ブランチ

```
main
├── feature/log-input
├── feature/weekly-report
└── fix/photo-upload-error
```

### 5.2 コミットメッセージ

Conventional Commits に従う。

```
<type>: <description>

[optional body]
```

| type | 用途 |
|------|------|
| feat | 新機能の追加 |
| fix | バグ修正 |
| refactor | リファクタリング |
| style | コードスタイルの変更（動作に影響なし） |
| test | テストの追加・修正 |
| docs | ドキュメントの変更 |
| chore | ビルド設定・依存関係の変更 |

```
# 例
feat: ログ入力フォームを実装
fix: 写真アップロード時のエラーハンドリングを修正
refactor: 日付ユーティリティを date-fns に統一
```

### 5.3 .gitignore

以下を管理対象外とする：

- `node_modules/`
- `.next/`
- `.env.local`
- `.env*.local`

---

## 6. コードレビュー観点

- 型安全性（`any` が使われていないか）
- RLS を迂回するコードがないか
- APIキーがクライアントに露出していないか
- バリデーションが適切に行われているか
- エラーハンドリングが実装されているか
- レスポンシブ対応されているか
