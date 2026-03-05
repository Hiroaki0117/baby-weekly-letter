import { describe, it, expect } from "vitest";
import { commentSchema } from "@/schemas/comment";

describe("commentSchema", () => {
  it("1文字のコメントで有効", () => {
    const result = commentSchema.safeParse({ text: "あ" });
    expect(result.success).toBe(true);
  });

  it("100文字のコメントで有効", () => {
    const result = commentSchema.safeParse({ text: "あ".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("空文字はエラー", () => {
    const result = commentSchema.safeParse({ text: "" });
    expect(result.success).toBe(false);
  });

  it("空白のみはエラー", () => {
    const result = commentSchema.safeParse({ text: "   " });
    expect(result.success).toBe(false);
  });

  it("101文字以上はエラー", () => {
    const result = commentSchema.safeParse({ text: "あ".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("前後の空白はトリムされる", () => {
    const result = commentSchema.safeParse({ text: "  コメント  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe("コメント");
    }
  });
});
