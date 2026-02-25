import { describe, it, expect } from "vitest";
import { createFamilySchema, joinFamilySchema } from "@/schemas/family";

describe("createFamilySchema", () => {
  it("有効なデータを受け入れる（子供1人）", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
      children: [{ name: "さくた", birthDate: "2025-06-15" }],
    });
    expect(result.success).toBe(true);
  });

  it("有効なデータを受け入れる（子供2人）", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
      children: [
        { name: "太郎", birthDate: "2024-12-22" },
        { name: "花子", birthDate: "2025-09-15" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("子供の名前だけ（生年月日なし）でも有効", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "ママ",
      children: [{ name: "太郎" }],
    });
    expect(result.success).toBe(true);
  });

  it("子供の情報が空オブジェクトでも有効", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "ママ",
      children: [{}],
    });
    expect(result.success).toBe(true);
  });

  // TODO: Phase 6 (Task 6.2) でスキーマを children 配列に変更後に有効化
  it.todo("children配列が空の場合はエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
      children: [],
    });
    expect(result.success).toBe(false);
  });

  // TODO: Phase 6 (Task 6.2) でスキーマを children 配列に変更後に有効化
  it.todo("childrenが未指定の場合はエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
    });
    expect(result.success).toBe(false);
  });

  it("家族名が空の場合はエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "",
      displayName: "パパ",
      children: [{ name: "太郎" }],
    });
    expect(result.success).toBe(false);
  });

  it("表示名が空の場合はエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "",
      children: [{ name: "太郎" }],
    });
    expect(result.success).toBe(false);
  });

  it("家族名が50文字を超えるとエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "あ".repeat(51),
      displayName: "パパ",
      children: [{ name: "太郎" }],
    });
    expect(result.success).toBe(false);
  });

  it("表示名が30文字を超えるとエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "あ".repeat(31),
      children: [{ name: "太郎" }],
    });
    expect(result.success).toBe(false);
  });

  // TODO: Phase 6 (Task 6.2) でスキーマを children 配列に変更後に有効化
  it.todo("子供の名前が50文字を超えるとエラー", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
      children: [{ name: "あ".repeat(51) }],
    });
    expect(result.success).toBe(false);
  });

  it("3人以上の子供でも有効", () => {
    const result = createFamilySchema.safeParse({
      familyName: "田中家",
      displayName: "パパ",
      children: [
        { name: "太郎", birthDate: "2022-01-01" },
        { name: "花子", birthDate: "2024-06-15" },
        { name: "三郎", birthDate: "2025-12-01" },
      ],
    });
    expect(result.success).toBe(true);
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
