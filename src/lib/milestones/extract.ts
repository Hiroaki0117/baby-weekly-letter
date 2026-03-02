import { getGeminiModel } from "@/lib/gemini/client";
import { buildExtractPrompt } from "./extract-prompt";
import type { DailyLog } from "@/types";

export type ExtractedMilestone = {
  title: string;
  date: string;
  category: string;
  memo?: string;
};

/**
 * 育児ログからマイルストーンをAI抽出する
 */
export async function extractMilestones(
  logs: DailyLog[]
): Promise<ExtractedMilestone[]> {
  if (logs.length === 0) return [];

  const model = getGeminiModel();
  const prompt = buildExtractPrompt(logs);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // マークダウンのコードブロックを除去
    const jsonText = text
      .replace(/^```json?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) return [];

    // バリデーション: 必須フィールドがあるもののみ
    const validCategories = ["motor", "language", "eating", "lifestyle", "other"];
    return parsed.filter(
      (item: Record<string, unknown>) =>
        typeof item.title === "string" &&
        item.title.length > 0 &&
        typeof item.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
        typeof item.category === "string" &&
        validCategories.includes(item.category)
    ) as ExtractedMilestone[];
  } catch (error) {
    console.error("Milestone extraction failed:", error);
    return [];
  }
}
