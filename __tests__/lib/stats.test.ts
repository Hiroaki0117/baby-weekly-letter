import { describe, it, expect } from "vitest";
import {
  calcWeeklyCounts,
  calcWeeklyMoods,
  calcMonthlyCounts,
  calcMonthlyMoods,
  calcYearlyCounts,
  calcYearlyMoods,
  calcCategoryCounts,
  calcWeeklyCategoryCounts,
  calcMonthlyCategoryCounts,
  calcSingleMonthCategoryCounts,
  calcYearlyCategoryCounts,
} from "@/lib/stats";
import type { DailyLog } from "@/types";

function makelog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: "1",
    family_id: "f1",
    child_id: "c1",
    author_id: "a1",
    log_date: "2025-06-15",
    text: "test",
    mood: "happy",
    categories: [],
    photo_storage_path: null,
    created_at: "2025-06-15T00:00:00Z",
    updated_at: "2025-06-15T00:00:00Z",
    ...overrides,
  };
}

describe("calcWeeklyCounts", () => {
  it("空配列なら全曜日0を返す", () => {
    const weekStart = new Date(2025, 5, 16); // 月曜
    const result = calcWeeklyCounts([], weekStart);
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ label: "月", count: 0 });
    expect(result[6]).toEqual({ label: "日", count: 0 });
  });

  it("週内のログをカウントする", () => {
    const weekStart = new Date(2025, 5, 16); // 2025-06-16 月曜
    const logs = [
      makelog({ id: "1", log_date: "2025-06-16" }), // 月
      makelog({ id: "2", log_date: "2025-06-16" }), // 月（2件目）
      makelog({ id: "3", log_date: "2025-06-18" }), // 水
      makelog({ id: "4", log_date: "2025-06-23" }), // 週外
    ];
    const result = calcWeeklyCounts(logs, weekStart);
    expect(result[0].count).toBe(2); // 月
    expect(result[2].count).toBe(1); // 水
    expect(result[1].count).toBe(0); // 火
  });
});

describe("calcWeeklyMoods", () => {
  it("週内の気分をカウントする", () => {
    const weekStart = new Date(2025, 5, 16);
    const logs = [
      makelog({ id: "1", log_date: "2025-06-16", mood: "happy" }),
      makelog({ id: "2", log_date: "2025-06-16", mood: "moved" }),
    ];
    const result = calcWeeklyMoods(logs, weekStart);
    expect(result[0].happy).toBe(1);
    expect(result[0].moved).toBe(1);
    expect(result[0].sad).toBe(0);
  });
});

describe("calcMonthlyCounts", () => {
  it("指定年の1月〜12月を返す", () => {
    const logs = [
      makelog({ id: "1", log_date: "2025-01-10" }),
      makelog({ id: "2", log_date: "2025-01-20" }),
      makelog({ id: "3", log_date: "2025-06-15" }),
      makelog({ id: "4", log_date: "2024-01-10" }), // 別の年
    ];
    const result = calcMonthlyCounts(logs, 2025);
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ label: "1月", count: 2 });
    expect(result[5]).toEqual({ label: "6月", count: 1 });
    expect(result[11]).toEqual({ label: "12月", count: 0 });
  });
});

describe("calcMonthlyMoods", () => {
  it("指定年の気分を月ごとにカウントする", () => {
    const logs = [
      makelog({ id: "1", log_date: "2025-03-10", mood: "happy" }),
      makelog({ id: "2", log_date: "2025-03-15", mood: "sad" }),
    ];
    const result = calcMonthlyMoods(logs, 2025);
    expect(result[2].happy).toBe(1);
    expect(result[2].sad).toBe(1);
    expect(result[2].moved).toBe(0);
  });
});

describe("calcYearlyCounts", () => {
  it("直近5年分を返す", () => {
    const currentYear = new Date().getFullYear();
    const logs = [
      makelog({ id: "1", log_date: `${currentYear}-06-15` }),
      makelog({ id: "2", log_date: `${currentYear - 1}-03-10` }),
    ];
    const result = calcYearlyCounts(logs);
    expect(result).toHaveLength(5);
    expect(result[4]).toEqual({ label: String(currentYear), count: 1 });
    expect(result[3]).toEqual({ label: String(currentYear - 1), count: 1 });
    expect(result[0]).toEqual({ label: String(currentYear - 4), count: 0 });
  });
});

describe("calcYearlyMoods", () => {
  it("直近5年分の気分をカウントする", () => {
    const currentYear = new Date().getFullYear();
    const logs = [
      makelog({ id: "1", log_date: `${currentYear}-06-15`, mood: "moved" }),
      makelog({ id: "2", log_date: `${currentYear}-06-20`, mood: "happy" }),
    ];
    const result = calcYearlyMoods(logs);
    expect(result[4].moved).toBe(1);
    expect(result[4].happy).toBe(1);
  });
});

describe("calcCategoryCounts", () => {
  it("空配列なら空を返す", () => {
    expect(calcCategoryCounts([])).toEqual([]);
  });

  it("カテゴリがないログは集計されない", () => {
    const logs = [makelog({ id: "1", categories: [] })];
    expect(calcCategoryCounts(logs)).toEqual([]);
  });

  it("カテゴリを日本語ラベルで集計し降順で返す", () => {
    const logs = [
      makelog({ id: "1", categories: ["meal", "sleep"] }),
      makelog({ id: "2", categories: ["meal", "play"] }),
      makelog({ id: "3", categories: ["meal"] }),
    ];
    const result = calcCategoryCounts(logs);
    expect(result[0]).toEqual({ category: "食事", count: 3 });
    expect(result.find((c) => c.category === "睡眠")?.count).toBe(1);
    expect(result.find((c) => c.category === "遊び")?.count).toBe(1);
  });
});

describe("calcWeeklyCategoryCounts", () => {
  it("週内のログのカテゴリのみ集計する", () => {
    const weekStart = new Date(2025, 5, 16); // 2025-06-16 月曜
    const logs = [
      makelog({ id: "1", log_date: "2025-06-16", categories: ["meal", "sleep"] }),
      makelog({ id: "2", log_date: "2025-06-18", categories: ["meal"] }),
      makelog({ id: "3", log_date: "2025-06-23", categories: ["play"] }), // 週外
    ];
    const result = calcWeeklyCategoryCounts(logs, weekStart);
    expect(result[0]).toEqual({ category: "食事", count: 2 });
    expect(result.find((c) => c.category === "睡眠")?.count).toBe(1);
    expect(result.find((c) => c.category === "遊び")).toBeUndefined();
  });
});

describe("calcMonthlyCategoryCounts", () => {
  it("指定年のログのカテゴリのみ集計する", () => {
    const logs = [
      makelog({ id: "1", log_date: "2025-03-10", categories: ["meal"] }),
      makelog({ id: "2", log_date: "2025-06-15", categories: ["meal", "play"] }),
      makelog({ id: "3", log_date: "2024-03-10", categories: ["sleep"] }), // 別の年
    ];
    const result = calcMonthlyCategoryCounts(logs, 2025);
    expect(result[0]).toEqual({ category: "食事", count: 2 });
    expect(result.find((c) => c.category === "遊び")?.count).toBe(1);
    expect(result.find((c) => c.category === "睡眠")).toBeUndefined();
  });
});

describe("calcSingleMonthCategoryCounts", () => {
  it("指定年月のログのカテゴリのみ集計する", () => {
    const logs = [
      makelog({ id: "1", log_date: "2025-03-10", categories: ["meal", "sleep"] }),
      makelog({ id: "2", log_date: "2025-03-20", categories: ["meal"] }),
      makelog({ id: "3", log_date: "2025-06-15", categories: ["play"] }), // 別の月
      makelog({ id: "4", log_date: "2024-03-10", categories: ["sleep"] }), // 別の年
    ];
    const result = calcSingleMonthCategoryCounts(logs, 2025, 3);
    expect(result[0]).toEqual({ category: "食事", count: 2 });
    expect(result.find((c) => c.category === "睡眠")?.count).toBe(1);
    expect(result.find((c) => c.category === "遊び")).toBeUndefined();
  });
});

describe("calcYearlyCategoryCounts", () => {
  it("直近5年分のログのカテゴリのみ集計する", () => {
    const currentYear = new Date().getFullYear();
    const logs = [
      makelog({ id: "1", log_date: `${currentYear}-06-15`, categories: ["meal"] }),
      makelog({ id: "2", log_date: `${currentYear - 1}-03-10`, categories: ["meal", "sleep"] }),
      makelog({ id: "3", log_date: `${currentYear - 10}-01-01`, categories: ["play"] }), // 範囲外
    ];
    const result = calcYearlyCategoryCounts(logs);
    expect(result[0]).toEqual({ category: "食事", count: 2 });
    expect(result.find((c) => c.category === "睡眠")?.count).toBe(1);
    expect(result.find((c) => c.category === "遊び")).toBeUndefined();
  });
});
