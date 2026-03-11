import { describe, it, expect } from "vitest";
import { calcDurationMinutes, buildTimestamps, classifySleep } from "@/lib/sleep";

describe("calcDurationMinutes", () => {
  it("通常の睡眠時間を計算できる", () => {
    const result = calcDurationMinutes(
      "2026-03-11T22:00:00+09:00",
      "2026-03-12T06:30:00+09:00",
    );
    expect(result).toBe(510); // 8.5時間
  });

  it("短い昼寝を計算できる", () => {
    const result = calcDurationMinutes(
      "2026-03-11T13:00:00+09:00",
      "2026-03-11T14:30:00+09:00",
    );
    expect(result).toBe(90); // 1.5時間
  });

  it("ちょうど1時間", () => {
    const result = calcDurationMinutes(
      "2026-03-11T20:00:00+00:00",
      "2026-03-11T21:00:00+00:00",
    );
    expect(result).toBe(60);
  });
});

// タイムゾーンオフセットの正規表現（例: +09:00, -05:00, +00:00）
const TZ_RE = /[+-]\d{2}:\d{2}$/;

describe("buildTimestamps", () => {
  it("同日の睡眠（昼寝）を正しく構築する", () => {
    const result = buildTimestamps("2026-03-11", "13:00", "14:30");
    expect(result.startedAt).toMatch(/^2026-03-11T13:00:00[+-]\d{2}:\d{2}$/);
    expect(result.endedAt).toMatch(/^2026-03-11T14:30:00[+-]\d{2}:\d{2}$/);
    expect(result.startedAt).toMatch(TZ_RE);
    expect(result.endedAt).toMatch(TZ_RE);
  });

  it("日またぎの睡眠を正しく構築する", () => {
    const result = buildTimestamps("2026-03-11", "21:00", "06:30");
    expect(result.startedAt).toMatch(/^2026-03-11T21:00:00[+-]\d{2}:\d{2}$/);
    expect(result.endedAt).toMatch(/^2026-03-12T06:30:00[+-]\d{2}:\d{2}$/);
  });

  it("深夜0時ちょうどに寝た場合は日またぎしない", () => {
    const result = buildTimestamps("2026-03-11", "00:00", "07:00");
    expect(result.startedAt).toMatch(/^2026-03-11T00:00:00[+-]\d{2}:\d{2}$/);
    expect(result.endedAt).toMatch(/^2026-03-11T07:00:00[+-]\d{2}:\d{2}$/);
  });

  it("同じ時刻の場合は日またぎとして扱う", () => {
    const result = buildTimestamps("2026-03-11", "12:00", "12:00");
    expect(result.startedAt).toMatch(/^2026-03-11T12:00:00[+-]\d{2}:\d{2}$/);
    expect(result.endedAt).toMatch(/^2026-03-12T12:00:00[+-]\d{2}:\d{2}$/);
  });

  it("月末の日またぎを正しく処理する", () => {
    const result = buildTimestamps("2026-03-31", "23:00", "06:00");
    expect(result.startedAt).toMatch(/^2026-03-31T23:00:00[+-]\d{2}:\d{2}$/);
    expect(result.endedAt).toMatch(/^2026-04-01T06:00:00[+-]\d{2}:\d{2}$/);
  });

  it("タイムゾーンオフセットが両方のタイムスタンプで一致する", () => {
    const result = buildTimestamps("2026-03-11", "22:00", "06:00");
    const startTz = result.startedAt.slice(-6);
    const endTz = result.endedAt.slice(-6);
    expect(startTz).toBe(endTz);
  });
});

describe("classifySleep", () => {
  // テスト用ヘルパー: JST 時刻を ISO 文字列に変換
  function jst(hour: number, minute = 0): string {
    // JST = UTC+9 なので UTC 時刻は hour - 9
    const utcHour = (hour - 9 + 24) % 24;
    const h = String(utcHour).padStart(2, "0");
    const m = String(minute).padStart(2, "0");
    return `2026-03-11T${h}:${m}:00+00:00`;
  }

  it("6:00 JST は日中睡眠", () => {
    expect(classifySleep(jst(6, 0))).toBe("daytime");
  });

  it("12:00 JST は日中睡眠", () => {
    expect(classifySleep(jst(12, 0))).toBe("daytime");
  });

  it("18:59 JST は日中睡眠", () => {
    expect(classifySleep(jst(18, 59))).toBe("daytime");
  });

  it("19:00 JST は夜間睡眠", () => {
    expect(classifySleep(jst(19, 0))).toBe("night");
  });

  it("23:00 JST は夜間睡眠", () => {
    expect(classifySleep(jst(23, 0))).toBe("night");
  });

  it("0:00 JST は夜間睡眠", () => {
    expect(classifySleep(jst(0, 0))).toBe("night");
  });

  it("5:59 JST は夜間睡眠", () => {
    expect(classifySleep(jst(5, 59))).toBe("night");
  });

  it("タイムゾーン付きの文字列でも正しく判定する", () => {
    // 21:30 JST = 12:30 UTC
    expect(classifySleep("2026-03-11T21:30:00+09:00")).toBe("night");
    // 14:00 JST = 05:00 UTC
    expect(classifySleep("2026-03-11T14:00:00+09:00")).toBe("daytime");
  });
});
