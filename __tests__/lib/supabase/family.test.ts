import { describe, it, expect, vi } from "vitest";
import { getMyFamilyId } from "@/lib/supabase/family";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function createMockSupabase(
  rpcResult: { data: string | null; error: unknown }
) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as SupabaseClient<Database>;
}

describe("getMyFamilyId", () => {
  it("family_members にレコードがある場合、family_id を返す", async () => {
    const mockSupabase = createMockSupabase({
      data: "family-uuid-123",
      error: null,
    });

    const result = await getMyFamilyId(mockSupabase);

    expect(result).toBe("family-uuid-123");
    expect(mockSupabase.rpc).toHaveBeenCalledWith("my_family_id");
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

  it("my_family_id RPC を呼び出していること", async () => {
    const rpcFn = vi.fn().mockResolvedValue({
      data: "test-id",
      error: null,
    });

    const mockSupabase = { rpc: rpcFn } as unknown as SupabaseClient<Database>;

    await getMyFamilyId(mockSupabase);

    expect(rpcFn).toHaveBeenCalledWith("my_family_id");
  });
});
