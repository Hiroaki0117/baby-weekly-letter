import { describe, it, expect, vi } from "vitest";
import { getMyFamilyId } from "@/lib/supabase/family";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function createMockSupabase(
  singleResult: { data: { family_id: string } | null; error: unknown }
) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(singleResult),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("getMyFamilyId", () => {
  it("family_members にレコードがある場合、family_id を返す", async () => {
    const mockSupabase = createMockSupabase({
      data: { family_id: "family-uuid-123" },
      error: null,
    });

    const result = await getMyFamilyId(mockSupabase);

    expect(result).toBe("family-uuid-123");
    expect(mockSupabase.from).toHaveBeenCalledWith("family_members");
  });

  it("family_members にレコードがない場合、null を返す", async () => {
    const mockSupabase = createMockSupabase({
      data: null,
      error: null,
    });

    const result = await getMyFamilyId(mockSupabase);

    expect(result).toBeNull();
  });

  it("エラーが発生した場合、null を返す", async () => {
    const mockSupabase = createMockSupabase({
      data: null,
      error: { message: "RLS policy violation" },
    });

    const result = await getMyFamilyId(mockSupabase);

    expect(result).toBeNull();
  });

  it("select で family_id カラムを指定していること", async () => {
    const maybeSingleFn = vi.fn().mockResolvedValue({
      data: { family_id: "test-id" },
      error: null,
    });
    const selectFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
    const fromFn = vi.fn().mockReturnValue({ select: selectFn });

    const mockSupabase = { from: fromFn } as unknown as SupabaseClient<Database>;

    await getMyFamilyId(mockSupabase);

    expect(fromFn).toHaveBeenCalledWith("family_members");
    expect(selectFn).toHaveBeenCalledWith("family_id");
  });
});
