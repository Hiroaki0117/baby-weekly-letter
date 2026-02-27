import { describe, it, expect } from "vitest";
import { growthRecordSchema } from "@/schemas/growth";

describe("growthRecordSchema", () => {
  it("身長のみで有効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: 65.5,
      weight_kg: null,
    });
    expect(result.success).toBe(true);
  });

  it("体重のみで有効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: null,
      weight_kg: 7.25,
    });
    expect(result.success).toBe(true);
  });

  it("身長・体重の両方で有効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: 65.5,
      weight_kg: 7.25,
    });
    expect(result.success).toBe(true);
  });

  it("身長・体重の両方がnullの場合は無効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: null,
      weight_kg: null,
    });
    expect(result.success).toBe(false);
  });

  it("計測日が空の場合は無効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "",
      height_cm: 65.5,
      weight_kg: null,
    });
    expect(result.success).toBe(false);
  });

  it("身長が範囲外（小さすぎ）の場合は無効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: 10,
      weight_kg: null,
    });
    expect(result.success).toBe(false);
  });

  it("身長が範囲外（大きすぎ）の場合は無効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: 250,
      weight_kg: null,
    });
    expect(result.success).toBe(false);
  });

  it("体重が範囲外（小さすぎ）の場合は無効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: null,
      weight_kg: 0.1,
    });
    expect(result.success).toBe(false);
  });

  it("体重が範囲外（大きすぎ）の場合は無効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: null,
      weight_kg: 150,
    });
    expect(result.success).toBe(false);
  });

  it("境界値: 身長20cmで有効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: 20,
      weight_kg: null,
    });
    expect(result.success).toBe(true);
  });

  it("境界値: 体重0.5kgで有効", () => {
    const result = growthRecordSchema.safeParse({
      measured_date: "2025-06-01",
      height_cm: null,
      weight_kg: 0.5,
    });
    expect(result.success).toBe(true);
  });
});
