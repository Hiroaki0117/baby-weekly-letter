import { describe, it, expect } from "vitest";
import { calcMonthAge } from "@/lib/growth";

describe("calcMonthAge", () => {
  it("同日の場合は0を返す", () => {
    expect(calcMonthAge("2025-01-15", "2025-01-15")).toBe(0);
  });

  it("ちょうど1ヶ月後は1.0を返す", () => {
    expect(calcMonthAge("2025-01-15", "2025-02-15")).toBe(1);
  });

  it("6ヶ月後を正しく計算する", () => {
    expect(calcMonthAge("2025-01-01", "2025-07-01")).toBe(6);
  });

  it("12ヶ月後を正しく計算する", () => {
    expect(calcMonthAge("2024-06-01", "2025-06-01")).toBe(12);
  });

  it("半端な日数を含む月齢を小数で返す", () => {
    const result = calcMonthAge("2025-01-01", "2025-01-16");
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it("24ヶ月（2歳）を正しく計算する", () => {
    expect(calcMonthAge("2024-01-01", "2026-01-01")).toBe(24);
  });
});
