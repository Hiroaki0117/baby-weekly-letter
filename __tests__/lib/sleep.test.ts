import { describe, it, expect } from "vitest";
import { calcDurationMinutes, buildTimestamps } from "@/lib/sleep";

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
