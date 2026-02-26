import { describe, it, expect } from "vitest";
import { buildReactionMap, REACTION_STAMPS } from "@/lib/reactions";

const USER_A = "user-a";
const USER_B = "user-b";
const LOG_1 = "log-1";
const LOG_2 = "log-2";

describe("buildReactionMap", () => {
  it("空配列の場合は空オブジェクトを返す", () => {
    const result = buildReactionMap([], USER_A);
    expect(result).toEqual({});
  });

  it("1件のリアクションを正しく集計する", () => {
    const raw = [{ log_id: LOG_1, user_id: USER_A, emoji: "heart" }];
    const result = buildReactionMap(raw, USER_A);

    expect(result[LOG_1]).toBeDefined();
    expect(result[LOG_1]).toHaveLength(REACTION_STAMPS.length);

    const heart = result[LOG_1].find((r) => r.emoji === "heart");
    expect(heart).toEqual({ emoji: "heart", count: 1, reacted: true });

    const clap = result[LOG_1].find((r) => r.emoji === "clap");
    expect(clap).toEqual({ emoji: "clap", count: 0, reacted: false });
  });

  it("同じログに複数ユーザーのリアクションを集計する", () => {
    const raw = [
      { log_id: LOG_1, user_id: USER_A, emoji: "heart" },
      { log_id: LOG_1, user_id: USER_B, emoji: "heart" },
      { log_id: LOG_1, user_id: USER_B, emoji: "clap" },
    ];
    const result = buildReactionMap(raw, USER_A);

    const heart = result[LOG_1].find((r) => r.emoji === "heart");
    expect(heart).toEqual({ emoji: "heart", count: 2, reacted: true });

    const clap = result[LOG_1].find((r) => r.emoji === "clap");
    expect(clap).toEqual({ emoji: "clap", count: 1, reacted: false });
  });

  it("複数ログのリアクションをログID別に集計する", () => {
    const raw = [
      { log_id: LOG_1, user_id: USER_A, emoji: "smile" },
      { log_id: LOG_2, user_id: USER_B, emoji: "muscle" },
    ];
    const result = buildReactionMap(raw, USER_A);

    expect(Object.keys(result)).toHaveLength(2);

    const log1Smile = result[LOG_1].find((r) => r.emoji === "smile");
    expect(log1Smile).toEqual({ emoji: "smile", count: 1, reacted: true });

    const log2Muscle = result[LOG_2].find((r) => r.emoji === "muscle");
    expect(log2Muscle).toEqual({ emoji: "muscle", count: 1, reacted: false });
  });

  it("自分がリアクションしていない場合 reacted が false になる", () => {
    const raw = [
      { log_id: LOG_1, user_id: USER_B, emoji: "sparkle" },
    ];
    const result = buildReactionMap(raw, USER_A);

    const sparkle = result[LOG_1].find((r) => r.emoji === "sparkle");
    expect(sparkle).toEqual({ emoji: "sparkle", count: 1, reacted: false });
  });

  it("全スタンプ種別のエントリが必ず返される", () => {
    const raw = [{ log_id: LOG_1, user_id: USER_A, emoji: "heart" }];
    const result = buildReactionMap(raw, USER_A);

    const emojis = result[LOG_1].map((r) => r.emoji);
    for (const stamp of REACTION_STAMPS) {
      expect(emojis).toContain(stamp.key);
    }
  });
});
