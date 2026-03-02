import { getGeminiModel } from "@/lib/gemini/client";
import { buildPrompt } from "./prompt";
import type { DailyLog, ReportPreferences } from "@/types";

type GenerateContext = {
  childName?: string | null;
  childBirthDate?: string | null;
  previousReportEnding?: string | null;
};

export async function generateWeeklyReport(
  logs: DailyLog[],
  weekStart: string,
  weekEnd: string,
  context?: GenerateContext | null,
  preferences?: ReportPreferences | null
): Promise<string> {
  const model = getGeminiModel();
  const prompt = buildPrompt(logs, weekStart, weekEnd, context, preferences);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("週次通信の生成に失敗しました（空のレスポンス）");
  }

  return text;
}
