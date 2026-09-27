import { GoogleGenerativeAI } from "@google/generative-ai";

// モデル廃止時はコードを変えずに環境変数 GEMINI_MODEL で差し替えられるようにする
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function resolveGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: resolveGeminiModelName() });
}
