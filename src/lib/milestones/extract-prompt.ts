import { formatDateSlash } from "@/lib/date";
import { MOOD_OPTIONS, CATEGORY_OPTIONS } from "@/types";
import type { DailyLog } from "@/types";

function formatMood(mood: string): string {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.label ?? mood;
}

function formatCategories(categories: string[]): string {
  if (categories.length === 0) return "なし";
  return categories
    .map((c) => CATEGORY_OPTIONS.find((opt) => opt.value === c)?.label ?? c)
    .join(", ");
}

function formatLogForPrompt(log: DailyLog): string {
  return `【${formatDateSlash(log.log_date)}】
気分: ${formatMood(log.mood)}
カテゴリ: ${formatCategories(log.categories)}
内容: ${log.text}`;
}

export function buildExtractPrompt(logs: DailyLog[]): string {
  const logsText = logs.map(formatLogForPrompt).join("\n\n");

  return `あなたは育児ログから成長マイルストーン（「初めて○○した」「○○ができるようになった」）を検出するアシスタントです。

以下の育児ログを読み、成長の節目と判断できるエピソードを抽出してください。

## 出力フォーマット
JSON配列で出力してください。該当なしの場合は空配列 [] を返してください。
JSONのみを出力し、マークダウンのコードブロックや説明文は付けないでください。

[
  {
    "title": "初めて寝返りした",
    "date": "2026-02-18",
    "category": "motor",
    "memo": "右から左に寝返り成功"
  }
]

## カテゴリ
- motor: 運動（寝返り、ハイハイ、つかまり立ち、歩く等）
- language: ことば（初めての発語、二語文、新しい言葉等）
- eating: 食事（離乳食開始、手づかみ食べ、新しい食材等）
- lifestyle: 生活習慣（一人で着替え、トイレトレーニング等）
- other: その他（初めての旅行、初めてのプール等）

## 注意
- 明確に「初めて」や「できるようになった」と判断できるもののみ抽出
- 曖昧なものは抽出しない
- 日付はログの日付を使用する
- titleは簡潔に（20文字以内が目安）
- memoは補足情報を1文で

## ログ

${logsText}`;
}
