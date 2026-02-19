import { describe, it, expect } from "vitest";
import { logFormSchema } from "@/schemas/log";

describe("logFormSchema", () => {
  it("有効なデータを受け入れる", () => {
    const result = logFormSchema.safeParse({
      text: "今日は離乳食をよく食べた",
      mood: "happy",
      categories: ["meal", "growth"],
      log_date: "2026-02-18",
    });
    expect(result.success).toBe(true);
  });

  it("テキストが空の場合はエラー", () => {
    const result = logFormSchema.safeParse({
      text: "",
      mood: "happy",
      categories: [],
      log_date: "2026-02-18",
    });
    expect(result.success).toBe(false);
  });

  it("moodが不正な値の場合はエラー", () => {
    const result = logFormSchema.safeParse({
      text: "テスト",
      mood: "invalid",
      categories: [],
      log_date: "2026-02-18",
    });
    expect(result.success).toBe(false);
  });

  it("カテゴリが空配列でもOK", () => {
    const result = logFormSchema.safeParse({
      text: "テスト",
      mood: "neutral",
      categories: [],
      log_date: "2026-02-18",
    });
    expect(result.success).toBe(true);
  });

  it("テキストが2000文字を超えるとエラー", () => {
    const result = logFormSchema.safeParse({
      text: "あ".repeat(2001),
      mood: "sad",
      categories: [],
      log_date: "2026-02-18",
    });
    expect(result.success).toBe(false);
  });
});
