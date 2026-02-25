import { describe, it, expect } from "vitest";
import { logFormSchema } from "@/schemas/log";

describe("logFormSchema", () => {
  const validBase = {
    text: "今日は離乳食をよく食べた",
    mood: "happy" as const,
    categories: ["meal", "growth"],
    log_date: "2026-02-18",
  };

  it("有効なデータを受け入れる（child_id付き）", () => {
    const result = logFormSchema.safeParse({
      ...validBase,
      child_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  // TODO: Phase 3 (Task 3.1) でスキーマに child_id を追加後に有効化
  it.todo("child_idが未指定の場合はエラー", () => {
    const result = logFormSchema.safeParse(validBase);
    expect(result.success).toBe(false);
  });

  // TODO: Phase 3 (Task 3.1) でスキーマに child_id を追加後に有効化
  it.todo("child_idが空文字の場合はエラー", () => {
    const result = logFormSchema.safeParse({
      ...validBase,
      child_id: "",
    });
    expect(result.success).toBe(false);
  });

  it("テキストが空の場合はエラー", () => {
    const result = logFormSchema.safeParse({
      ...validBase,
      text: "",
      child_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("moodが不正な値の場合はエラー", () => {
    const result = logFormSchema.safeParse({
      ...validBase,
      mood: "invalid",
      child_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("カテゴリが空配列でもOK", () => {
    const result = logFormSchema.safeParse({
      ...validBase,
      categories: [],
      child_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("テキストが2000文字を超えるとエラー", () => {
    const result = logFormSchema.safeParse({
      ...validBase,
      text: "あ".repeat(2001),
      child_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("全ての有効なmood値を受け入れる", () => {
    const moods = ["moved", "happy", "neutral", "tired", "sad"] as const;
    for (const mood of moods) {
      const result = logFormSchema.safeParse({
        ...validBase,
        mood,
        child_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    }
  });
});
