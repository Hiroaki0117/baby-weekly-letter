import { describe, it, expect } from "vitest";
import { buildCommentMap } from "@/lib/comments";

function makeRawComment(overrides: Record<string, string> = {}) {
  return {
    id: "c1",
    log_id: "log1",
    user_id: "u1",
    text: "テストコメント",
    created_at: "2026-03-05T10:00:00Z",
    updated_at: "2026-03-05T10:00:00Z",
    ...overrides,
  };
}

describe("buildCommentMap", () => {
  it("空配列なら空オブジェクトを返す", () => {
    expect(buildCommentMap([])).toEqual({});
  });

  it("ログID別にグルーピングされる", () => {
    const raw = [
      makeRawComment({ id: "c1", log_id: "log1" }),
      makeRawComment({ id: "c2", log_id: "log2" }),
      makeRawComment({ id: "c3", log_id: "log1" }),
    ];
    const result = buildCommentMap(raw);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["log1"]).toHaveLength(2);
    expect(result["log2"]).toHaveLength(1);
  });

  it("コメントはcreated_at昇順でソートされる", () => {
    const raw = [
      makeRawComment({ id: "c1", log_id: "log1", created_at: "2026-03-05T12:00:00Z" }),
      makeRawComment({ id: "c2", log_id: "log1", created_at: "2026-03-05T08:00:00Z" }),
      makeRawComment({ id: "c3", log_id: "log1", created_at: "2026-03-05T10:00:00Z" }),
    ];
    const result = buildCommentMap(raw);
    expect(result["log1"].map((c) => c.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("フィールドが正しくマッピングされる", () => {
    const raw = [
      makeRawComment({
        id: "c1",
        log_id: "log1",
        user_id: "u1",
        text: "こんにちは",
        created_at: "2026-03-05T10:00:00Z",
        updated_at: "2026-03-05T11:00:00Z",
      }),
    ];
    const result = buildCommentMap(raw);
    expect(result["log1"][0]).toEqual({
      id: "c1",
      logId: "log1",
      userId: "u1",
      text: "こんにちは",
      createdAt: "2026-03-05T10:00:00Z",
      updatedAt: "2026-03-05T11:00:00Z",
    });
  });

  it("同一ユーザーが複数コメントできる", () => {
    const raw = [
      makeRawComment({ id: "c1", log_id: "log1", user_id: "u1", created_at: "2026-03-05T10:00:00Z" }),
      makeRawComment({ id: "c2", log_id: "log1", user_id: "u1", created_at: "2026-03-05T11:00:00Z" }),
    ];
    const result = buildCommentMap(raw);
    expect(result["log1"]).toHaveLength(2);
  });
});
