import { describe, it, expect } from "vitest";
import {
  getWeekRange,
  toDateString,
  fromDateString,
  formatDateJa,
  formatDateSlash,
  formatWeekRange,
} from "@/lib/date";

describe("getWeekRange", () => {
  it("水曜日を渡すと月曜〜日曜を返す", () => {
    const { start, end } = getWeekRange(new Date("2026-02-18")); // 水曜
    expect(toDateString(start)).toBe("2026-02-16"); // 月曜
    expect(toDateString(end)).toBe("2026-02-22"); // 日曜
  });

  it("月曜日を渡すとその週の月曜〜日曜を返す", () => {
    const { start, end } = getWeekRange(new Date("2026-02-16")); // 月曜
    expect(toDateString(start)).toBe("2026-02-16");
    expect(toDateString(end)).toBe("2026-02-22");
  });

  it("日曜日を渡すとその週の月曜〜日曜を返す", () => {
    const { start, end } = getWeekRange(new Date("2026-02-22")); // 日曜
    expect(toDateString(start)).toBe("2026-02-16");
    expect(toDateString(end)).toBe("2026-02-22");
  });
});

describe("toDateString", () => {
  it("DateをYYYY-MM-DD形式に変換する", () => {
    expect(toDateString(new Date("2026-02-18"))).toBe("2026-02-18");
  });
});

describe("fromDateString", () => {
  it("YYYY-MM-DD文字列をDateに変換する", () => {
    const date = fromDateString("2026-02-18");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1); // 0-indexed
    expect(date.getDate()).toBe(18);
  });

  it("無効な文字列でエラーを投げる", () => {
    expect(() => fromDateString("invalid")).toThrow();
  });
});

describe("formatDateJa", () => {
  it("日本語表示にフォーマットする", () => {
    const result = formatDateJa("2026-02-18");
    expect(result).toContain("2月18日");
  });
});

describe("formatDateSlash", () => {
  it("YYYY/MM/DD形式にフォーマットする", () => {
    expect(formatDateSlash("2026-02-18")).toBe("2026/02/18");
  });
});

describe("formatWeekRange", () => {
  it("週の範囲をフォーマットする", () => {
    const result = formatWeekRange("2026-02-16", "2026-02-22");
    expect(result).toBe("2026/02/16〜2026/02/22");
  });
});
