import { describe, it, expect } from "vitest";
import { classifyTempPeriod, calcNormalTemperature, percentile } from "@/lib/temperature";

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

describe("percentile", () => {
  it("中央値（50パーセンタイル）を正しく返す", () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it("偶数個の場合に補間する", () => {
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
  });

  it("25パーセンタイル", () => {
    expect(percentile([1, 2, 3, 4, 5], 25)).toBe(2);
  });
});

describe("calcNormalTemperature", () => {
  const rec = (t: number) => ({ temperature: t });

  it("5件未満はnullを返す", () => {
    expect(calcNormalTemperature([rec(36.5), rec(36.6), rec(36.4), rec(36.7)])).toBeNull();
  });

  it("正常範囲のデータで平熱を算出する", () => {
    const records = [36.3, 36.5, 36.4, 36.6, 36.5, 36.7, 36.4].map(rec);
    const result = calcNormalTemperature(records);
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThanOrEqual(36.3);
    expect(result).toBeLessThanOrEqual(36.7);
  });

  it("発熱の外れ値を除外して算出する", () => {
    const records = [36.5, 36.4, 36.6, 36.5, 36.3, 36.5, 36.4, 39.0, 38.5].map(rec);
    const result = calcNormalTemperature(records);
    expect(result).not.toBeNull();
    // 39.0, 38.5 が除外されるので平熱は36台のはず
    expect(result!).toBeLessThan(37.0);
  });

  it("全員平熱が高い人でも正しく算出する", () => {
    const records = [37.2, 37.3, 37.4, 37.5, 37.3, 37.2, 37.4].map(rec);
    const result = calcNormalTemperature(records);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(37.2);
    expect(result!).toBeLessThanOrEqual(37.5);
  });

  it("空配列はnullを返す", () => {
    expect(calcNormalTemperature([])).toBeNull();
  });
});
