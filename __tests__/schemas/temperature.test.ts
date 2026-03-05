import { describe, it, expect } from "vitest";
import { temperatureRecordSchema } from "@/schemas/temperature";

describe("temperatureRecordSchema", () => {
  it("正常な体温で有効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "2026-03-05T08:00:00",
      temperature: 36.5,
    });
    expect(result.success).toBe(true);
  });

  it("発熱時の体温で有効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "2026-03-05T20:00:00",
      temperature: 38.8,
    });
    expect(result.success).toBe(true);
  });

  it("計測日時が空の場合は無効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "",
      temperature: 36.5,
    });
    expect(result.success).toBe(false);
  });

  it("体温が範囲外（低すぎ）の場合は無効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "2026-03-05T08:00:00",
      temperature: 33.9,
    });
    expect(result.success).toBe(false);
  });

  it("体温が範囲外（高すぎ）の場合は無効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "2026-03-05T08:00:00",
      temperature: 42.1,
    });
    expect(result.success).toBe(false);
  });

  it("境界値: 34.0℃で有効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "2026-03-05T08:00:00",
      temperature: 34.0,
    });
    expect(result.success).toBe(true);
  });

  it("境界値: 42.0℃で有効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "2026-03-05T08:00:00",
      temperature: 42.0,
    });
    expect(result.success).toBe(true);
  });

  it("体温が未指定の場合は無効", () => {
    const result = temperatureRecordSchema.safeParse({
      measured_at: "2026-03-05T08:00:00",
    });
    expect(result.success).toBe(false);
  });
});
