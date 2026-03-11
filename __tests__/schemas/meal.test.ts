import { describe, it, expect } from "vitest";
import { mealRecordSchema } from "@/schemas/meal";

describe("mealRecordSchema", () => {
  it("正常なリクエストを受け付ける", () => {
    const result = mealRecordSchema.safeParse({
      meal_date: "2026-03-11",
      meal_type: "breakfast",
      amount: "normal",
    });
    expect(result.success).toBe(true);
  });

  it("全てのmeal_typeを受け付ける", () => {
    for (const type of ["breakfast", "lunch", "dinner", "snack"]) {
      const result = mealRecordSchema.safeParse({
        meal_date: "2026-03-11",
        meal_type: type,
        amount: "normal",
      });
      expect(result.success).toBe(true);
    }
  });

  it("全てのamountを受け付ける", () => {
    for (const amount of ["plenty", "normal", "little", "none"]) {
      const result = mealRecordSchema.safeParse({
        meal_date: "2026-03-11",
        meal_type: "lunch",
        amount,
      });
      expect(result.success).toBe(true);
    }
  });

  it("不正なmeal_typeはエラー", () => {
    const result = mealRecordSchema.safeParse({
      meal_date: "2026-03-11",
      meal_type: "brunch",
      amount: "normal",
    });
    expect(result.success).toBe(false);
  });

  it("不正なamountはエラー", () => {
    const result = mealRecordSchema.safeParse({
      meal_date: "2026-03-11",
      meal_type: "lunch",
      amount: "a_lot",
    });
    expect(result.success).toBe(false);
  });

  it("meal_dateが空文字はエラー", () => {
    const result = mealRecordSchema.safeParse({
      meal_date: "",
      meal_type: "lunch",
      amount: "normal",
    });
    expect(result.success).toBe(false);
  });

  it("フィールドが不足している場合はエラー", () => {
    const result = mealRecordSchema.safeParse({
      meal_date: "2026-03-11",
    });
    expect(result.success).toBe(false);
  });
});
