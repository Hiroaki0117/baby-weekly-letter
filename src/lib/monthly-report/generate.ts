import { getGeminiModel } from "@/lib/gemini/client";
import { buildMonthlyPrompt } from "./prompt";
import type { WeeklyReport, ReportPreferences } from "@/types";

type GenerateContext = {
  childName?: string | null;
  childBirthDate?: string | null;
  previousMonthlyEnding?: string | null;
};

export async function generateMonthlyReport(
  weeklyReports: WeeklyReport[],
  year: number,
  month: number,
  context?: GenerateContext | null,
  preferences?: ReportPreferences | null
): Promise<string> {
  const model = getGeminiModel();
  const prompt = buildMonthlyPrompt(weeklyReports, year, month, context, preferences);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("月次アルバムの生成に失敗しました（空のレスポンス）");
  }

  return text;
}
