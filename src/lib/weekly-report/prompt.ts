import { formatDateSlash, calcAge } from "@/lib/date";
import { MOOD_OPTIONS, CATEGORY_OPTIONS } from "@/types";
import type { DailyLog, ReportPreferences, ReportTone, ReportSection } from "@/types";

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

// --- トーン定義 ---

type ToneDefinition = {
  role: string;
  styleGuide: string;
};

const TONE_DEFINITIONS: Record<ReportTone, ToneDefinition> = {
  warm: {
    role: "「温かみのある手紙」として紡ぎ出してください。",
    styleGuide: `- 語り手は「育児日記の書き手」。親しみやすい敬体（です・ます調）。
- 単なる出来事の羅列ではなく、エピソードを「ストーリー」として紡ぐこと。
- 冒頭は、今週を象徴する一場面やひとことから書き始める。
- 具体的な描写を大切に。「嬉しかった」で終わらせず、何がどう嬉しかったか。
- ログにない出来事を推測して書かないこと。ログの内容のみを元にする。
- 最後は前向きな一文で締めくくる。
- 500〜800字程度。`,
  },
  humor: {
    role: "「ユーモアを交えた楽しい手紙」として書いてください。",
    styleGuide: `- 語り手は「育児日記の書き手」。親しみやすい敬体（です・ます調）。
- 適度なユーモアや軽快な表現を交え、読んで思わず笑顔になる文体。
- 深刻になりすぎず、日常の面白さや愛おしさを引き出す。
- 具体的なエピソードにツッコミや気の利いたコメントを添える。
- ログにない出来事を推測して書かないこと。ログの内容のみを元にする。
- 最後は明るく前向きな一文で締めくくる。
- 500〜800字程度。`,
  },
  neutral: {
    role: "「落ち着いた記録」としてまとめてください。",
    styleGuide: `- 語り手は「育児日記の書き手」。落ち着いた敬体（です・ます調）。
- 客観的で簡潔な文体。感情表現は控えめに、事実を中心に記述する。
- 何が起きたか、どう変化したかを明確に伝える。
- 具体的な描写は大切にしつつ、淡々と丁寧に書く。
- ログにない出来事を推測して書かないこと。ログの内容のみを元にする。
- 最後は穏やかな一文で締めくくる。
- 500〜800字程度。`,
  },
  poetic: {
    role: "「詩的なエッセイ」として描いてください。",
    styleGuide: `- 語り手は「育児日記の書き手」。柔らかく情緒的な敬体（です・ます調）。
- 比喩や情景描写を豊かに使い、日常の中の美しさを浮かび上がらせる。
- 季節感や五感の描写（音、光、匂い、手触り）を大切にする。
- エピソードを映像的に描写し、読み手の心に映像が浮かぶように。
- ログにない出来事を推測して書かないこと。ログの内容のみを元にする。
- 最後は余韻の残る一文で締めくくる。
- 500〜800字程度。`,
  },
};

// --- セクション定義（週次用） ---

const WEEKLY_SECTION_DEFINITIONS: Record<ReportSection, string> = {
  highlight: "✨ 今週のハイライト: 今週最も印象的なエピソードを1つ選び、深く掘り下げて書く",
  digest: "📅 日々のダイジェスト: 日ごとのハイライトを短く紡ぐ",
  growth: "🌱 成長メモ: 前回の通信と比較して見られる変化や成長を書く",
  encouragement: "💌 親へのひとこと: 書き手（親）への労いや応援の言葉を添える",
  quote: "💬 今週の名言: ログの中から印象的なひとことを引用し、コメントを添える",
};

function buildSectionGuide(sections: ReportSection[]): string {
  const items = sections.map((s) => `- ${WEEKLY_SECTION_DEFINITIONS[s]}`).join("\n");
  return `## 構成ガイド

以下のセクションを含めて通信を構成してください。
各セクションには絵文字1つ+見出しテキストを付けてください。

${items}`;
}

// --- メイン ---

type PromptContext = {
  childName?: string | null;
  childBirthDate?: string | null;
  previousReportEnding?: string | null;
};

export function buildPrompt(
  logs: DailyLog[],
  weekStart: string,
  weekEnd: string,
  context?: PromptContext | null,
  preferences?: ReportPreferences | null
): string {
  const logsText = logs.map(formatLogForPrompt).join("\n\n");
  const dateRange = `${formatDateSlash(weekStart)}〜${formatDateSlash(weekEnd)}`;

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
${toneDef.role}
${backgroundSection}${previousSection}
## 思考指示（この部分は出力に含めないでください）

通信を書く前に、以下を考えてください：
1. 今週のログ全体を通して、最も印象に残るエピソードは何か？
2. 複数のログに共通するテーマや、変化の兆しはあるか？
3. 親（書き手）の気持ちはどう変化しているか？
${context?.previousReportEnding ? "4. 前回の通信からの成長や変化で注目すべき点はあるか？" : ""}

## 文体ガイドライン

${toneDef.styleGuide}

${buildSectionGuide(sections)}

## 出力フォーマット

以下のヘッダーで始めてください：

📮 すくすく日記（${dateRange}）

その後、本文をそのまま続けてください。

## 今週のログ（${dateRange}）

${logsText}`;
}
