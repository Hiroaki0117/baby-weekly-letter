import { calcAge } from "@/lib/date";
import type {
  WeeklyReport,
  MonthlyReport,
  Milestone,
  ReportPreferences,
  ReportTone,
} from "@/types";

type PromptContext = {
  childName?: string | null;
  childBirthDate?: string | null;
};

type AnnualData = {
  monthlyReports: MonthlyReport[];
  weeklyReports: WeeklyReport[];
  milestones: Milestone[];
  growthSummary: {
    startHeight: number | null;
    endHeight: number | null;
    startWeight: number | null;
    endWeight: number | null;
  } | null;
};

const TONE_LABELS: Record<ReportTone, string> = {
  warm: "温かみのある、やさしいエッセイ調",
  humor: "明るくユーモアを交えた楽しい文体",
  neutral: "落ち着いた客観的なトーン",
  poetic: "詩的で情緒豊かな文体",
};

const MONTH_NAMES = [
  "", "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

function buildMonthlyData(
  monthlyReports: MonthlyReport[],
  weeklyReports: WeeklyReport[],
  fiscalYear: number,
): string {
  const months: string[] = [];
  // 年度順: 4月〜翌3月
  const fiscalMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

  for (const m of fiscalMonths) {
    const year = m >= 4 ? fiscalYear : fiscalYear + 1;
    const monthStr = `${year}-${String(m).padStart(2, "0")}`;

    // 月次まとめがあればそれを使う
    const monthly = monthlyReports.find((r) => r.month.startsWith(monthStr));
    if (monthly) {
      months.push(`### ${MONTH_NAMES[m]}（${year}年）\n${monthly.content}`);
      continue;
    }

    // なければ週次通信をまとめる
    const weeklies = weeklyReports.filter((r) =>
      r.week_start.startsWith(monthStr),
    );
    if (weeklies.length > 0) {
      const combined = weeklies.map((w) => w.content).join("\n---\n");
      months.push(
        `### ${MONTH_NAMES[m]}（${year}年）[週次通信より]\n${combined}`,
      );
      continue;
    }

    // データなし
    months.push(`### ${MONTH_NAMES[m]}（${year}年）\n（記録なし）`);
  }

  return months.join("\n\n");
}

function buildMilestoneData(milestones: Milestone[]): string {
  if (milestones.length === 0) return "（マイルストーンの記録なし）";

  return milestones
    .map((m) => `- ${m.milestone_date}: ${m.title}`)
    .join("\n");
}

function buildGrowthData(
  summary: AnnualData["growthSummary"],
): string {
  if (!summary) return "（成長データの記録なし）";

  const parts: string[] = [];
  if (summary.startHeight != null && summary.endHeight != null) {
    parts.push(
      `身長: ${summary.startHeight}cm → ${summary.endHeight}cm（+${(summary.endHeight - summary.startHeight).toFixed(1)}cm）`,
    );
  }
  if (summary.startWeight != null && summary.endWeight != null) {
    parts.push(
      `体重: ${summary.startWeight}kg → ${summary.endWeight}kg（+${(summary.endWeight - summary.startWeight).toFixed(1)}kg）`,
    );
  }
  return parts.length > 0 ? parts.join("\n") : "（成長データの記録なし）";
}

export function buildAnnualPrompt(
  fiscalYear: number,
  data: AnnualData,
  context?: PromptContext | null,
  preferences?: ReportPreferences | null,
): string {
  const yearLabel = `${fiscalYear}年度`;
  const tone = preferences?.tone ?? "warm";
  const toneLabel = TONE_LABELS[tone];

  const monthlyData = buildMonthlyData(
    data.monthlyReports,
    data.weeklyReports,
    fiscalYear,
  );
  const milestoneData = buildMilestoneData(data.milestones);
  const growthData = buildGrowthData(data.growthSummary);

  let backgroundSection = "";
  if (context?.childName || context?.childBirthDate) {
    const parts: string[] = [];
    if (context.childName) {
      parts.push(`お子さまの名前: ${context.childName}`);
    }
    if (context.childBirthDate) {
      const fiscalStart = new Date(fiscalYear, 3, 1); // 4月1日
      const age = calcAge(context.childBirthDate, fiscalStart);
      parts.push(`年度開始時の年齢: ${age}`);
    }
    backgroundSection = `## 背景情報\n${parts.join("\n")}\n`;
  }

  return `あなたは育児日記「すくすく日記」の年次アルバム制作者です。
1年間の月次まとめ・週次通信を読み返し、${yearLabel}の年間ダイジェストを作成してください。

${backgroundSection}
## 文体
${toneLabel}で書いてください。

## 出力形式

以下の JSON 形式で出力してください。JSON のみを出力し、他のテキストは含めないでください。

\`\`\`json
{
  "monthHighlights": [
    { "month": 4, "text": "4月のハイライト文（1〜2文、30〜60字）" },
    { "month": 5, "text": "..." },
    ...
  ],
  "closingMessage": "1年の総括メッセージ（3〜5文、感動的な締めの文章）"
}
\`\`\`

### monthHighlights のルール
- 年度の各月（4月〜3月）について、その月の最も印象的な出来事を1〜2文で要約する
- 記録がない月はスキップする（配列に含めない）
- 通信にない出来事を推測して書かない

### closingMessage のルール
- 1年間の成長を振り返り、感動的なメッセージを3〜5文で書く
- マイルストーンや成長データも参考にする
- 最後は前向きな一文で締めくくる

## ${yearLabel}の記録データ

### 月別の通信
${monthlyData}

### マイルストーン（初めてできたこと）
${milestoneData}

### 成長データ
${growthData}`;
}
