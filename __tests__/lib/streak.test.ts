import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStreak } from "@/lib/streak";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase のモック: .from("daily_logs").select("log_date").gte(...).order(...)
 * のチェーン呼び出しを再現する
 */
function createMockSupabase(logDates: string[]) {
  const data = logDates.map((d) => ({ log_date: d }));
  const orderFn = vi.fn().mockResolvedValue({ data, error: null });
  const gteFn = vi.fn().mockReturnValue({ order: orderFn });
  const selectFn = vi.fn().mockReturnValue({ gte: gteFn });
  const fromFn = vi.fn().mockReturnValue({ select: selectFn });

  return { from: fromFn } as unknown as SupabaseClient<Database>;
}

function createErrorMockSupabase() {
  const orderFn = vi
    .fn()
    .mockResolvedValue({ data: null, error: { message: "error" } });
  const gteFn = vi.fn().mockReturnValue({ order: orderFn });
  const selectFn = vi.fn().mockReturnValue({ gte: gteFn });
  const fromFn = vi.fn().mockReturnValue({ select: selectFn });

  return { from: fromFn } as unknown as SupabaseClient<Database>;
}

describe("getStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("今日を含む連続3日のログがある場合、3を返す", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    const mockSupabase = createMockSupabase([
      "2026-02-25",
      "2026-02-24",
      "2026-02-23",
    ]);

    const result = await getStreak(mockSupabase);
    expect(result).toBe(3);
  });

  it("今日のログがなく昨日から連続2日の場合、2を返す", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    const mockSupabase = createMockSupabase(["2026-02-24", "2026-02-23"]);

    const result = await getStreak(mockSupabase);
    expect(result).toBe(2);
  });

  it("今日のログのみの場合、1を返す", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    const mockSupabase = createMockSupabase(["2026-02-25"]);

    const result = await getStreak(mockSupabase);
    expect(result).toBe(1);
  });

  it("ログが全くない場合、0を返す", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    const mockSupabase = createMockSupabase([]);

    const result = await getStreak(mockSupabase);
    expect(result).toBe(0);
  });

  it("エラーの場合、0を返す", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    const mockSupabase = createErrorMockSupabase();

    const result = await getStreak(mockSupabase);
    expect(result).toBe(0);
  });

  it("連続が途切れている場合、途切れるまでの日数を返す", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    // 2/25, 2/24 は連続だが 2/23 はなく、2/22 はある
    const mockSupabase = createMockSupabase([
      "2026-02-25",
      "2026-02-24",
      "2026-02-22",
    ]);

    const result = await getStreak(mockSupabase);
    expect(result).toBe(2);
  });

  it("今日のログがなく昨日もない場合、0を返す", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    // 2/23 以前のログしかない
    const mockSupabase = createMockSupabase(["2026-02-23", "2026-02-22"]);

    const result = await getStreak(mockSupabase);
    expect(result).toBe(0);
  });

  it("同日に複数ログがある場合も1日としてカウント", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    // 2/25 が2回、2/24 が1回
    const mockSupabase = createMockSupabase([
      "2026-02-25",
      "2026-02-25",
      "2026-02-24",
    ]);

    const result = await getStreak(mockSupabase);
    expect(result).toBe(2);
  });

  it("daily_logsテーブルを正しく参照している", async () => {
    vi.setSystemTime(new Date("2026-02-25"));
    const mockSupabase = createMockSupabase([]);

    await getStreak(mockSupabase);
    expect(mockSupabase.from).toHaveBeenCalledWith("daily_logs");
  });
});
