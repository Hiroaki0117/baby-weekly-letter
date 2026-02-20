import { describe, it, expect } from "vitest";
import {
  getWeekRange,
  toDateString,
  fromDateString,
  formatDateJa,
  formatDateSlash,
  formatWeekRange,
  calcAge,
  getCalendarDays,
  getCalendarRange,
  formatMonthJa,
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

describe("calcAge", () => {
  it("生後数日の場合", () => {
    const result = calcAge("2026-02-10", new Date("2026-02-18"));
    expect(result).toBe("生後8日");
  });

  it("生後1ヶ月以上の場合", () => {
    const result = calcAge("2025-12-18", new Date("2026-02-18"));
    expect(result).toBe("生後2ヶ月");
  });

  it("生後6ヶ月の場合", () => {
    const result = calcAge("2025-08-18", new Date("2026-02-18"));
    expect(result).toBe("生後6ヶ月");
  });

  it("1歳以上の場合", () => {
    const result = calcAge("2024-11-18", new Date("2026-02-18"));
    expect(result).toBe("1歳3ヶ月");
  });

  it("ちょうど1歳の場合", () => {
    const result = calcAge("2025-02-18", new Date("2026-02-18"));
    expect(result).toBe("1歳");
  });
});

describe("getCalendarDays", () => {
  it("2026年2月のカレンダー日数を返す（月曜始まり）", () => {
    const days = getCalendarDays(2026, 1); // month は 0-indexed
    // 2026-02-01 は日曜 → カレンダーは 01/26(月) 開始
    // 2026-02-28 は土曜 → カレンダーは 03/01(日) 終了
    expect(days.length).toBeGreaterThanOrEqual(28);
    expect(days.length % 7).toBe(0); // 7の倍数

    // 最初の日は月曜
    expect(days[0].getDay()).toBe(1); // 月曜=1
    // 最後の日は日曜
    expect(days[days.length - 1].getDay()).toBe(0); // 日曜=0
  });

  it("2026年3月のカレンダー日数を返す", () => {
    const days = getCalendarDays(2026, 2);
    expect(days.length % 7).toBe(0);
    expect(days[0].getDay()).toBe(1);
  });
});

describe("getCalendarRange", () => {
  it("カレンダー表示範囲を返す", () => {
    const { start, end } = getCalendarRange(2026, 1); // 2月
    expect(start.getDay()).toBe(1); // 月曜始まり
    expect(end.getDay()).toBe(0); // 日曜終わり
  });
});

describe("formatMonthJa", () => {
  it("年月を日本語フォーマットする", () => {
    expect(formatMonthJa(2026, 1)).toBe("2026年2月"); // 0-indexed
    expect(formatMonthJa(2026, 0)).toBe("2026年1月");
    expect(formatMonthJa(2026, 11)).toBe("2026年12月");
  });
});
