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

export function buildPrompt(
  logs: DailyLog[],
  weekStart: string,
  weekEnd: string
): string {
  const logsText = logs.map(formatLogForPrompt).join("\n\n");

  return `あなたは育児日記「すくすく日記」のライターです。
以下の1週間の育児ログをもとに、週次通信を生成してください。

## ルール
- 日本語で出力してください
- 文体はやさしく、少し感動的にしてください
- ログにない出来事を推測して書かないでください。ログの内容のみを元にしてください
- 読みやすく短い段落と箇条書きを混ぜてください
- 文字数は350〜500字程度にしてください
- 最後は必ず前向きな一文で締めてください

## 出力フォーマット（このフォーマットに厳密に従ってください）

📮 今週のすくすく日記（${formatDateSlash(weekStart)}〜${formatDateSlash(weekEnd)}）

（本文：今週の出来事を自然な文章でまとめる）

🌱 成長のきざし
・（ログから成長に関する内容を抽出）

😊 かわいかった瞬間
・（ログからかわいかった瞬間を抽出）

🫧 ちょっと大変だったこと
・（ログから大変だったことを抽出。なければ「特になし」）

🧡 パパ/ママのひとこと
（ログから親の気持ちを1〜2文でまとめる）

（前向きな一文で締める）

## 今週のログ（${formatDateSlash(weekStart)}〜${formatDateSlash(weekEnd)}）

${logsText}`;
}
