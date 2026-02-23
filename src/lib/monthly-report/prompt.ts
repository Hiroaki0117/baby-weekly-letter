import { calcAge } from "@/lib/date";
import type { WeeklyReport } from "@/types";

type PromptContext = {
  childName?: string | null;
  childBirthDate?: string | null;
  previousMonthlyEnding?: string | null;
};

function formatWeeklyForPrompt(report: WeeklyReport, index: number): string {
  return `【第${index + 1}週】
${report.content}`;
}

export function buildMonthlyPrompt(
  weeklyReports: WeeklyReport[],
  year: number,
  month: number,
  context?: PromptContext | null
): string {
  const monthLabel = `${year}年${month + 1}月`;
  const reportsText = weeklyReports
    .map((r, i) => formatWeeklyForPrompt(r, i))
    .join("\n\n---\n\n");

  // 背景情報セクション
  let backgroundSection = "";
  if (context?.childName || context?.childBirthDate) {
    const parts: string[] = [];
    if (context.childName) {
      parts.push(`お子さまの名前: ${context.childName}`);
    }
    if (context.childBirthDate) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const ageStart = calcAge(context.childBirthDate, monthStart);
      const ageEnd = calcAge(context.childBirthDate, monthEnd);
      parts.push(`月初の月齢: ${ageStart}`);
      if (ageStart !== ageEnd) {
        parts.push(`月末の月齢: ${ageEnd}`);
      }
    }
    backgroundSection = `
## 背景情報
${parts.join("\n")}
`;
  }

  // 前月まとめセクション
  let previousSection = "";
  if (context?.previousMonthlyEnding) {
    previousSection = `
## 前月のまとめより
前月の月次まとめの結びの部分:
「${context.previousMonthlyEnding}」
この続きとして、今月のまとめを書いてください。
`;
  }

  return `あなたは育児日記「すくすく日記」の専属エッセイストです。
親が毎週受け取った週次通信を読み返し、${monthLabel}全体を振り返る
「成長エッセイ」として紡ぎ出してください。
週次通信が「手紙」なら、月次まとめは「章」です。
1年で12章の成長物語になります。
${backgroundSection}${previousSection}
## 思考指示（この部分は出力に含めないでください）

エッセイを書く前に、以下を考えてください：
1. 月全体を通して、最も大きな変化や成長は何か？
2. 週をまたいで見えてくる成長のアーク（弧）はあるか？
3. 日常に潜む「特別な瞬間」は何か？
4. 月の始まりと終わりで、子どもや親はどう変わったか？
${context?.previousMonthlyEnding ? "5. 前月からの成長の連続性で注目すべき点はあるか？" : ""}

## 文体ガイドライン

- 語り手は「育児日記の書き手」。親しみやすい敬体（です・ます調）。
- 散文エッセイ形式で書くこと。見出し・箇条書きは使わない。
- 段落の切れ目で自然に話題を転換し、ゆるやかに月全体を描く。
- 具体的な描写を大切に。週次通信にあったエピソードを拾い上げ、月という視点で再構成する。
- 週次通信にない出来事を推測して書かないこと。通信の内容のみを元にする。
- 最後は前向きな一文で締めくくる。
- 800〜1200字程度。

## 出力フォーマット

以下のヘッダーで始めてください：

📖 すくすく日記 ${monthLabel}のまとめ

その後、本文をそのまま続けてください。

## ${monthLabel}の週次通信

${reportsText}`;
}
