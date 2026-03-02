import { describe, it, expect } from "vitest";
import { milestoneSchema } from "@/schemas/milestone";

describe("milestoneSchema", () => {
  const validData = {
    title: "初めて寝返りした",
    milestone_date: "2026-02-18",
    category: "motor" as const,
    memo: "右から左に成功",
  };

  it("有効なデータを受け入れる", () => {
    const result = milestoneSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("メモなしで有効", () => {
    const result = milestoneSchema.safeParse({
      title: validData.title,
      milestone_date: validData.milestone_date,
      category: validData.category,
    });
    expect(result.success).toBe(true);
  });

  it("メモ空文字で有効", () => {
    const result = milestoneSchema.safeParse({ ...validData, memo: "" });
    expect(result.success).toBe(true);
  });

  it("全カテゴリが有効", () => {
    for (const category of ["motor", "language", "eating", "lifestyle", "other"]) {
      const result = milestoneSchema.safeParse({ ...validData, category });
      expect(result.success).toBe(true);
    }
  });

  it("タイトル空文字を拒否", () => {
    const result = milestoneSchema.safeParse({ ...validData, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("タイトルを入力してください");
    }
  });

  it("タイトル101文字を拒否", () => {
    const result = milestoneSchema.safeParse({
      ...validData,
      title: "あ".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("無効なカテゴリを拒否", () => {
    const result = milestoneSchema.safeParse({ ...validData, category: "invalid" });
    expect(result.success).toBe(false);
  });

  it("無効な日付形式を拒否", () => {
    const result = milestoneSchema.safeParse({
      ...validData,
      milestone_date: "2026/02/18",
    });
    expect(result.success).toBe(false);
  });

  it("日付なしを拒否", () => {
    const result = milestoneSchema.safeParse({
      title: validData.title,
      category: validData.category,
    });
    expect(result.success).toBe(false);
  });

  it("メモ501文字を拒否", () => {
    const result = milestoneSchema.safeParse({
      ...validData,
      memo: "あ".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
