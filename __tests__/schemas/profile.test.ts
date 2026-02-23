import { describe, it, expect } from "vitest";
import { profileFormSchema, childFormSchema } from "@/schemas/profile";

describe("profileFormSchema", () => {
  it("表示名ありで有効", () => {
    const result = profileFormSchema.safeParse({
      display_name: "パパ",
    });
    expect(result.success).toBe(true);
  });

  it("表示名なしでも有効", () => {
    const result = profileFormSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("表示名が30文字を超えるとエラー", () => {
    const result = profileFormSchema.safeParse({
      display_name: "あ".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("表示名が30文字ちょうどなら有効", () => {
    const result = profileFormSchema.safeParse({
      display_name: "あ".repeat(30),
    });
    expect(result.success).toBe(true);
  });
});

describe("childFormSchema", () => {
  it("全フィールドありで有効", () => {
    const result = childFormSchema.safeParse({
      name: "さくた",
      birth_date: "2025-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("フィールドなしでも有効", () => {
    const result = childFormSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("名前が50文字を超えるとエラー", () => {
    const result = childFormSchema.safeParse({
      name: "あ".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("名前が50文字ちょうどなら有効", () => {
    const result = childFormSchema.safeParse({
      name: "あ".repeat(50),
    });
    expect(result.success).toBe(true);
  });
});
