import { describe, it, expect } from "vitest";
import {
  calcMonthlyCounts,
  calcMonthlyMoods,
  calcCategoryCounts,
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

describe("calcMonthlyCounts", () => {
  it("空配列なら空を返す", () => {
    expect(calcMonthlyCounts([])).toEqual([]);
  });

  it("月ごとにカウントし昇順で返す", () => {
    const logs = [
      makelog({ id: "1", log_date: "2025-06-01" }),
      makelog({ id: "2", log_date: "2025-06-15" }),
      makelog({ id: "3", log_date: "2025-05-10" }),
      makelog({ id: "4", log_date: "2025-07-01" }),
    ];
    expect(calcMonthlyCounts(logs)).toEqual([
      { month: "2025/05", count: 1 },
      { month: "2025/06", count: 2 },
      { month: "2025/07", count: 1 },
    ]);
  });
});

describe("calcMonthlyMoods", () => {
  it("空配列なら空を返す", () => {
    expect(calcMonthlyMoods([])).toEqual([]);
  });

  it("月ごとに気分をカウントする", () => {
    const logs = [
      makelog({ id: "1", log_date: "2025-06-01", mood: "happy" }),
      makelog({ id: "2", log_date: "2025-06-15", mood: "moved" }),
      makelog({ id: "3", log_date: "2025-06-20", mood: "happy" }),
      makelog({ id: "4", log_date: "2025-07-01", mood: "sad" }),
    ];
    const result = calcMonthlyMoods(logs);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      month: "2025/06",
      moved: 1,
      happy: 2,
      neutral: 0,
      tired: 0,
      sad: 0,
    });
    expect(result[1]).toEqual({
      month: "2025/07",
      moved: 0,
      happy: 0,
      neutral: 0,
      tired: 0,
      sad: 1,
    });
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

  it("カテゴリを展開してカウントし降順で返す", () => {
    const logs = [
      makelog({ id: "1", categories: ["食事", "睡眠"] }),
      makelog({ id: "2", categories: ["食事", "遊び"] }),
      makelog({ id: "3", categories: ["食事"] }),
    ];
    expect(calcCategoryCounts(logs)).toEqual([
      { category: "食事", count: 3 },
      { category: "睡眠", count: 1 },
      { category: "遊び", count: 1 },
    ]);
  });
});
