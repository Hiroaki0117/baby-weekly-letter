import { describe, it, expect } from "vitest";
import { generateAnnualReportSchema } from "@/schemas/annual-report";

describe("generateAnnualReportSchema", () => {
  it("正常なリクエストを受け付ける", () => {
    const result = generateAnnualReportSchema.safeParse({
      fiscalYear: 2025,
      childId: "test-child-id",
    });
    expect(result.success).toBe(true);
  });

  it("fiscalYearが整数でない場合はエラー", () => {
    const result = generateAnnualReportSchema.safeParse({
      fiscalYear: 2025.5,
      childId: "test-child-id",
    });
    expect(result.success).toBe(false);
  });

  it("fiscalYearが2020未満はエラー", () => {
    const result = generateAnnualReportSchema.safeParse({
      fiscalYear: 2019,
      childId: "test-child-id",
    });
    expect(result.success).toBe(false);
  });

  it("fiscalYearが2099超はエラー", () => {
    const result = generateAnnualReportSchema.safeParse({
      fiscalYear: 2100,
      childId: "test-child-id",
    });
    expect(result.success).toBe(false);
  });

  it("childIdが空文字はエラー", () => {
    const result = generateAnnualReportSchema.safeParse({
      fiscalYear: 2025,
      childId: "",
    });
    expect(result.success).toBe(false);
  });

  it("childIdがない場合はエラー", () => {
    const result = generateAnnualReportSchema.safeParse({
      fiscalYear: 2025,
    });
    expect(result.success).toBe(false);
  });
});
