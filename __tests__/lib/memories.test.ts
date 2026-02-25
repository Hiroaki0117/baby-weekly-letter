import { describe, it, expect } from "vitest";
import { getCandidateDates, groupMemoriesByYear } from "@/lib/memories";
import type { DailyLog } from "@/types";

function makeLog(overrides: Partial<DailyLog> & { log_date: string }): DailyLog {
  return {
    id: overrides.id ?? "log-1",
    family_id: overrides.family_id ?? "fam-1",
    child_id: overrides.child_id ?? "child-1",
    author_id: overrides.author_id ?? "user-1",
    log_date: overrides.log_date,
    text: overrides.text ?? "テスト",
    mood: overrides.mood ?? "happy",
    categories: overrides.categories ?? [],
    photo_storage_path: overrides.photo_storage_path ?? null,
    created_at: overrides.created_at ?? "2026-02-25T00:00:00Z",
    updated_at: overrides.updated_at ?? "2026-02-25T00:00:00Z",
  };
}

describe("getCandidateDates", () => {
  it("過去5年分の候補日を生成する", () => {
    const today = new Date(2026, 1, 25); // 2026-02-25
    const dates = getCandidateDates(today);

    expect(dates).toEqual([
      "2025-02-25",
      "2024-02-25",
      "2023-02-25",
      "2022-02-25",
      "2021-02-25",
    ]);
  });

  it("maxYearsで年数を指定できる", () => {
    const today = new Date(2026, 1, 25);
    const dates = getCandidateDates(today, 2);

    expect(dates).toEqual(["2025-02-25", "2024-02-25"]);
  });

  it("2/29はうるう年のみ候補に含める", () => {
    const today = new Date(2028, 1, 29); // 2028-02-29（うるう年）
    const dates = getCandidateDates(today, 5);

    // 2024はうるう年、2025-2027は平年
    expect(dates).toEqual(["2024-02-29"]);
  });

  it("通常の日付は毎年候補を生成する", () => {
    const today = new Date(2026, 0, 1); // 2026-01-01
    const dates = getCandidateDates(today, 3);

    expect(dates).toEqual(["2025-01-01", "2024-01-01", "2023-01-01"]);
  });
});

describe("groupMemoriesByYear", () => {
  const today = new Date(2026, 1, 25); // 2026-02-25

  it("空配列の場合は空配列を返す", () => {
    expect(groupMemoriesByYear([], today)).toEqual([]);
  });

  it("1年前のログをグルーピングする", () => {
    const logs = [makeLog({ log_date: "2025-02-25" })];
    const result = groupMemoriesByYear(logs, today);

    expect(result).toHaveLength(1);
    expect(result[0].yearsAgo).toBe(1);
    expect(result[0].label).toBe("1年前の今日");
    expect(result[0].date).toBe("2025-02-25");
    expect(result[0].dateLabel).toBe("2025年2月25日");
    expect(result[0].logs).toHaveLength(1);
  });

  it("複数年分をyearsAgo昇順でグルーピングする", () => {
    const logs = [
      makeLog({ id: "log-3", log_date: "2023-02-25" }),
      makeLog({ id: "log-1", log_date: "2025-02-25" }),
      makeLog({ id: "log-2", log_date: "2024-02-25" }),
    ];
    const result = groupMemoriesByYear(logs, today);

    expect(result).toHaveLength(3);
    expect(result[0].yearsAgo).toBe(1);
    expect(result[1].yearsAgo).toBe(2);
    expect(result[2].yearsAgo).toBe(3);
  });

  it("同じ年の複数ログをまとめる", () => {
    const logs = [
      makeLog({ id: "log-1", log_date: "2025-02-25" }),
      makeLog({ id: "log-2", log_date: "2025-02-25" }),
    ];
    const result = groupMemoriesByYear(logs, today);

    expect(result).toHaveLength(1);
    expect(result[0].logs).toHaveLength(2);
  });

  it("今年のログは含めない", () => {
    const logs = [makeLog({ log_date: "2026-02-25" })];
    const result = groupMemoriesByYear(logs, today);

    expect(result).toEqual([]);
  });

  it("dateLabelが正しいフォーマットになる", () => {
    const logs = [makeLog({ log_date: "2024-01-05" })];
    const result = groupMemoriesByYear(logs, new Date(2026, 0, 5));

    expect(result[0].dateLabel).toBe("2024年1月5日");
  });
});
