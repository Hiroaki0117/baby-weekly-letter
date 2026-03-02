import { calcAge } from "@/lib/date";
import type { WeeklyReport, ReportPreferences, ReportTone, ReportSection } from "@/types";

type PromptContext = {
  childName?: string | null;
  childBirthDate?: string | null;
  previousMonthlyEnding?: string | null;
};

function formatWeeklyForPrompt(report: WeeklyReport, index: number): string {
  return `【第${index + 1}週】
${report.content}`;
}

// --- トーン定義（月次用） ---

type ToneDefinition = {
  role: string;
  styleGuide: string;
};

const TONE_DEFINITIONS: Record<ReportTone, ToneDefinition> = {
  warm: {
    role: "「成長エッセイ」として紡ぎ出してください。\n週次通信が「手紙」なら、月次まとめは「章」です。\n1年で12章の成長物語になります。",
    styleGuide: `- 語り手は「育児日記の書き手」。親しみやすい敬体（です・ます調）。
- 散文エッセイ形式で書くこと。見出し・箇条書きは使わない。
- 段落の切れ目で自然に話題を転換し、ゆるやかに月全体を描く。
- 具体的な描写を大切に。週次通信にあったエピソードを拾い上げ、月という視点で再構成する。
- 週次通信にない出来事を推測して書かないこと。通信の内容のみを元にする。
- 最後は前向きな一文で締めくくる。
- 800〜1200字程度。`,
  },
  humor: {
    role: "「笑顔があふれる成長エッセイ」として書いてください。\n週次通信が「手紙」なら、月次まとめは「章」です。",
    styleGuide: `- 語り手は「育児日記の書き手」。親しみやすい敬体（です・ます調）。
- 散文エッセイ形式で書くこと。見出し・箇条書きは使わない。
- 適度なユーモアや軽快な表現を交え、読んで楽しくなる文体。
- 月全体を振り返りつつ、面白かったエピソードにはツッコミやコメントを添える。
- 週次通信にない出来事を推測して書かないこと。通信の内容のみを元にする。
- 最後は明るく前向きな一文で締めくくる。
- 800〜1200字程度。`,
  },
  neutral: {
    role: "「落ち着いた月間記録」としてまとめてください。\n週次通信が「手紙」なら、月次まとめは「章」です。",
    styleGuide: `- 語り手は「育児日記の書き手」。落ち着いた敬体（です・ます調）。
- 散文形式で書くこと。見出し・箇条書きは使わない。
- 客観的で簡潔な文体。感情表現は控えめに、事実と変化を中心に記述する。
- 月全体を通して何が変わったかを明確に伝える。
- 週次通信にない出来事を推測して書かないこと。通信の内容のみを元にする。
- 最後は穏やかな一文で締めくくる。
- 800〜1200字程度。`,
  },
  poetic: {
    role: "「詩的な成長エッセイ」として描いてください。\n週次通信が「手紙」なら、月次まとめは「章」です。",
    styleGuide: `- 語り手は「育児日記の書き手」。柔らかく情緒的な敬体（です・ます調）。
- 散文エッセイ形式で書くこと。見出し・箇条書きは使わない。
- 比喩や情景描写を豊かに使い、月全体を一編の散文詩のように描く。
- 季節感や五感の描写を大切にし、時の流れを感じさせる。
- 週次通信にない出来事を推測して書かないこと。通信の内容のみを元にする。
- 最後は余韻の残る一文で締めくくる。
- 800〜1200字程度。`,
  },
};

// --- セクション定義（月次用） ---

const MONTHLY_SECTION_DEFINITIONS: Record<ReportSection, string> = {
  highlight: "✨ 今月のハイライト: 今月最も印象的なエピソードを1つ選び、深く掘り下げて書く",
  digest: "📅 週ごとのダイジェスト: 各週のハイライトを短く紡ぐ",
  growth: "🌱 月間の成長: 月の始まりと終わりの変化を軸に成長を描く",
  encouragement: "💌 親へのひとこと: 書き手（親）への労いや応援の言葉を添える",
  quote: "💬 今月の名言: 週次通信の中から印象的なひとことを引用し、コメントを添える",
};

function buildMonthlySectionGuide(sections: ReportSection[]): string {
  const items = sections.map((s) => `- ${MONTHLY_SECTION_DEFINITIONS[s]}`).join("\n");
  return `## 構成ガイド

以下の要素をエッセイの中に自然に織り込んでください。
明示的な見出しは不要ですが、各要素が含まれるようにしてください。

${items}`;
}

// --- メイン ---

export function buildMonthlyPrompt(
  weeklyReports: WeeklyReport[],
  year: number,
  month: number,
  context?: PromptContext | null,
  preferences?: ReportPreferences | null
): string {
  const monthLabel = `${year}年${month + 1}月`;
  const reportsText = weeklyReports
    .map((r, i) => formatWeeklyForPrompt(r, i))
    .join("\n\n---\n\n");

  const tone = preferences?.tone ?? "warm";
  const sections = preferences?.sections ?? ["highlight", "digest", "growth"];
  const toneDef = TONE_DEFINITIONS[tone];

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
${toneDef.role}
${backgroundSection}${previousSection}
## 思考指示（この部分は出力に含めないでください）

エッセイを書く前に、以下を考えてください：
1. 月全体を通して、最も大きな変化や成長は何か？
2. 週をまたいで見えてくる成長のアーク（弧）はあるか？
3. 日常に潜む「特別な瞬間」は何か？
4. 月の始まりと終わりで、子どもや親はどう変わったか？
${context?.previousMonthlyEnding ? "5. 前月からの成長の連続性で注目すべき点はあるか？" : ""}

## 文体ガイドライン

${toneDef.styleGuide}

${buildMonthlySectionGuide(sections)}

## 出力フォーマット

以下のヘッダーで始めてください：

📖 すくすく日記 ${monthLabel}のまとめ

その後、本文をそのまま続けてください。

## ${monthLabel}の週次通信

${reportsText}`;
}
