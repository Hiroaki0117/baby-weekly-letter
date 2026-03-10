import { getGeminiModel } from "@/lib/gemini/client";
import { buildAnnualPrompt } from "./prompt";
import type {
  WeeklyReport,
  MonthlyReport,
  Milestone,
  ReportPreferences,
} from "@/types";

type GenerateContext = {
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

type GeneratedAnnualContent = {
  monthHighlights: { month: number; text: string }[];
  closingMessage: string;
};

export async function generateAnnualReport(
  fiscalYear: number,
  data: AnnualData,
  context?: GenerateContext | null,
  preferences?: ReportPreferences | null,
): Promise<GeneratedAnnualContent> {
  const model = getGeminiModel();
  const prompt = buildAnnualPrompt(fiscalYear, data, context, preferences);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("年次アルバムの生成に失敗しました（空のレスポンス）");
  }

  // JSON部分を抽出してパース
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("年次アルバムの生成結果をパースできませんでした");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedAnnualContent;

  if (!parsed.monthHighlights || !parsed.closingMessage) {
    throw new Error("年次アルバムの生成結果が不完全です");
  }

  return parsed;
}
