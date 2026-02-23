import { describe, it, expect } from "vitest";
import { createFamilySchema, joinFamilySchema } from "@/schemas/family";

describe("createFamilySchema", () => {
  it("有効なデータを受け入れる（全フィールド）", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
      childName: "さくた",
      childBirthDate: "2025-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("子ども情報なしでも有効", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "ママ",
    });
    expect(result.success).toBe(true);
  });

  it("家族名が空の場合はエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "",
      displayName: "パパ",
    });
    expect(result.success).toBe(false);
  });

  it("表示名が空の場合はエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "",
    });
    expect(result.success).toBe(false);
  });

  it("家族名が50文字を超えるとエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "あ".repeat(51),
      displayName: "パパ",
    });
    expect(result.success).toBe(false);
  });

  it("表示名が30文字を超えるとエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "あ".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("子ども名が50文字を超えるとエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
      childName: "あ".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

describe("joinFamilySchema", () => {
  it("トークンのみで有効", () => {
    const result = joinFamilySchema.safeParse({
      token: "abc-123-def",
    });
    expect(result.success).toBe(true);
  });

  it("トークンと表示名で有効", () => {
    const result = joinFamilySchema.safeParse({
      token: "abc-123-def",
      displayName: "ママ",
    });
    expect(result.success).toBe(true);
  });

  it("トークンが空の場合はエラー", () => {
    const result = joinFamilySchema.safeParse({
      token: "",
    });
    expect(result.success).toBe(false);
  });

  it("トークンがない場合はエラー", () => {
    const result = joinFamilySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("表示名が30文字を超えるとエラー", () => {
    const result = joinFamilySchema.safeParse({
      token: "abc-123-def",
      displayName: "あ".repeat(31),
    });
    expect(result.success).toBe(false);
  });
});
