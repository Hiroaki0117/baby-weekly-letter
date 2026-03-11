import { describe, it, expect } from "vitest";
import { sleepRecordSchema } from "@/schemas/sleep";

describe("sleepRecordSchema", () => {
  it("正常なリクエストを受け付ける", () => {
    const result = sleepRecordSchema.safeParse({
      sleep_date: "2026-03-11",
      started_at: "21:00",
      ended_at: "06:30",
    });
    expect(result.success).toBe(true);
  });

  it("sleep_dateが空文字はエラー", () => {
    const result = sleepRecordSchema.safeParse({
      sleep_date: "",
      started_at: "21:00",
      ended_at: "06:30",
    });
    expect(result.success).toBe(false);
  });

  it("started_atが空文字はエラー", () => {
    const result = sleepRecordSchema.safeParse({
      sleep_date: "2026-03-11",
      started_at: "",
      ended_at: "06:30",
    });
    expect(result.success).toBe(false);
  });

  it("ended_atが空文字はエラー", () => {
    const result = sleepRecordSchema.safeParse({
      sleep_date: "2026-03-11",
      started_at: "21:00",
      ended_at: "",
    });
    expect(result.success).toBe(false);
  });

  it("フィールドが不足している場合はエラー", () => {
    const result = sleepRecordSchema.safeParse({
      sleep_date: "2026-03-11",
    });
    expect(result.success).toBe(false);
  });
});
