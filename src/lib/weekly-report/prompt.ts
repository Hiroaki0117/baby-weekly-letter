import { formatDateSlash, calcAge } from "@/lib/date";
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

type PromptContext = {
  childName?: string | null;
  childBirthDate?: string | null;
  previousReportEnding?: string | null;
};

export function buildPrompt(
  logs: DailyLog[],
  weekStart: string,
  weekEnd: string,
  context?: PromptContext | null
): string {
  const logsText = logs.map(formatLogForPrompt).join("\n\n");
  const dateRange = `${formatDateSlash(weekStart)}〜${formatDateSlash(weekEnd)}`;

  // 背景情報セクション
  let backgroundSection = "";
  if (context?.childName || context?.childBirthDate) {
    const parts: string[] = [];
    if (context.childName) {
      parts.push(`お子さまの名前: ${context.childName}`);
    }
    if (context.childBirthDate) {
      const age = calcAge(context.childBirthDate);
      parts.push(`月齢: ${age}`);
    }
    backgroundSection = `
## 背景情報
${parts.join("\n")}
`;
  }

  // 前回通信セクション
  let previousSection = "";
  if (context?.previousReportEnding) {
    previousSection = `
## 前回の通信より
前回の週次通信の結びの部分:
「${context.previousReportEnding}」
この続きとして、今週の通信を書いてください。
`;
  }

  return `あなたは育児日記「すくすく日記」の専属ライターです。
親が日々書き残した育児ログを読み、その週の出来事を
「温かみのある手紙」として紡ぎ出してください。
${backgroundSection}${previousSection}
## 思考指示（この部分は出力に含めないでください）

通信を書く前に、以下を考えてください：
1. 今週のログ全体を通して、最も印象に残るエピソードは何か？
2. 複数のログに共通するテーマや、変化の兆しはあるか？
3. 親（書き手）の気持ちはどう変化しているか？
${context?.previousReportEnding ? "4. 前回の通信からの成長や変化で注目すべき点はあるか？" : ""}

## 文体ガイドライン

- 語り手は「育児日記の書き手」。親しみやすい敬体（です・ます調）。
- 単なる出来事の羅列ではなく、エピソードを「ストーリー」として紡ぐこと。
- 冒頭は、今週を象徴する一場面やひとことから書き始める。
- 具体的な描写を大切に。「嬉しかった」で終わらせず、何がどう嬉しかったか。
- ログにない出来事を推測して書かないこと。ログの内容のみを元にする。
- 最後は前向きな一文で締めくくる。
- 500〜800字程度。

## 構成ガイド

以下は参考例です。ログの内容に合わせて最適な構成を選んでください。
見出し付きの箇条書きと自然な散文を自由に組み合わせてOKです。

- テーマ型: 今週のテーマを1つ選び深く書く
- ダイジェスト型: 日ごとのハイライトを短く紡ぐ
- 成長ストーリー型: 週の始まりと終わりの変化を軸にする

セクション見出しには絵文字1つ+見出しテキストを使ってください。

## 出力フォーマット

以下のヘッダーで始めてください：

📮 すくすく日記（${dateRange}）

その後、本文をそのまま続けてください。

## 今週のログ（${dateRange}）

${logsText}`;
}
