import { describe, it, expect } from "vitest";
import { buildCalendarWeeks, formatMonthLabel } from "@/lib/calendar";

describe("buildCalendarWeeks", () => {
  it("2026年3月（日曜始まり → 月曜始まりで前に空白6つ）", () => {
    // 2026-03-01 は日曜日 → 月曜始まりだと最後の列(index 6)
    const weeks = buildCalendarWeeks(2026, 2); // month=2 → 3月
    expect(weeks[0]).toEqual([
      null, null, null, null, null, null, "2026-03-01",
    ]);
    expect(weeks[1][0]).toBe("2026-03-02"); // 月曜
    // 最終週に31日が含まれる
    const allDays = weeks.flat().filter(Boolean);
    expect(allDays).toHaveLength(31);
    expect(allDays[allDays.length - 1]).toBe("2026-03-31");
  });

  it("2026年2月（28日、日曜始まり）", () => {
    // 2026-02-01 は日曜日
    const weeks = buildCalendarWeeks(2026, 1);
    const allDays = weeks.flat().filter(Boolean);
    expect(allDays).toHaveLength(28);
    expect(allDays[0]).toBe("2026-02-01");
    expect(allDays[allDays.length - 1]).toBe("2026-02-28");
  });

  it("各週は7要素", () => {
    const weeks = buildCalendarWeeks(2026, 0); // 1月
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("月曜始まり — 2026年6月1日は月曜", () => {
    // 2026-06-01 は月曜日 → 空白なしで始まる
    const weeks = buildCalendarWeeks(2026, 5);
    expect(weeks[0][0]).toBe("2026-06-01");
  });
});

describe("formatMonthLabel", () => {
  it("正しいフォーマット", () => {
    expect(formatMonthLabel(2026, 0)).toBe("2026年1月");
    expect(formatMonthLabel(2026, 11)).toBe("2026年12月");
  });
});
