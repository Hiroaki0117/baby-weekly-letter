import { describe, it, expect } from "vitest";
import { classifyTempPeriod } from "@/lib/temperature";

// テスト用ヘルパー: JST 時刻を UTC の ISO 文字列に変換
function jst(hour: number, minute = 0): string {
  const utcHour = (hour - 9 + 24) % 24;
  const h = String(utcHour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `2026-03-11T${h}:${m}:00+00:00`;
}

describe("classifyTempPeriod", () => {
  // 朝 (morning): 5:00〜9:59
  it("5:00 JST は朝", () => {
    expect(classifyTempPeriod(jst(5, 0))).toBe("morning");
  });

  it("9:59 JST は朝", () => {
    expect(classifyTempPeriod(jst(9, 59))).toBe("morning");
  });

  // 昼 (afternoon): 10:00〜15:59
  it("10:00 JST は昼", () => {
    expect(classifyTempPeriod(jst(10, 0))).toBe("afternoon");
  });

  it("15:59 JST は昼", () => {
    expect(classifyTempPeriod(jst(15, 59))).toBe("afternoon");
  });

  // 夕 (evening): 16:00〜19:59
  it("16:00 JST は夕", () => {
    expect(classifyTempPeriod(jst(16, 0))).toBe("evening");
  });

  it("19:59 JST は夕", () => {
    expect(classifyTempPeriod(jst(19, 59))).toBe("evening");
  });

  // 夜 (night): 20:00〜翌4:59
  it("20:00 JST は夜", () => {
    expect(classifyTempPeriod(jst(20, 0))).toBe("night");
  });

  it("0:00 JST は夜", () => {
    expect(classifyTempPeriod(jst(0, 0))).toBe("night");
  });

  it("4:59 JST は夜", () => {
    expect(classifyTempPeriod(jst(4, 59))).toBe("night");
  });

  it("タイムゾーン付きの文字列でも正しく判定する", () => {
    // 7:30 JST = 22:30 UTC (前日)
    expect(classifyTempPeriod("2026-03-11T07:30:00+09:00")).toBe("morning");
    // 18:00 JST = 09:00 UTC
    expect(classifyTempPeriod("2026-03-11T18:00:00+09:00")).toBe("evening");
  });
});
