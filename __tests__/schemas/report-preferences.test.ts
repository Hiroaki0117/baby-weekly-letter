import { describe, it, expect } from "vitest";
import { reportPreferencesSchema } from "@/schemas/report-preferences";

describe("reportPreferencesSchema", () => {
  it("デフォルト値で有効", () => {
    const result = reportPreferencesSchema.safeParse({
      tone: "warm",
      sections: ["highlight", "digest", "growth"],
    });
    expect(result.success).toBe(true);
  });

  it("全トーンが有効", () => {
    for (const tone of ["warm", "humor", "neutral", "poetic"]) {
      const result = reportPreferencesSchema.safeParse({
        tone,
        sections: ["highlight"],
      });
      expect(result.success).toBe(true);
    }
  });

  it("無効なトーンを拒否", () => {
    const result = reportPreferencesSchema.safeParse({
      tone: "unknown",
      sections: ["highlight"],
    });
    expect(result.success).toBe(false);
  });

  it("全セクションONで有効", () => {
    const result = reportPreferencesSchema.safeParse({
      tone: "warm",
      sections: ["highlight", "digest", "growth", "encouragement", "quote"],
    });
    expect(result.success).toBe(true);
  });

  it("セクション1つで有効", () => {
    const result = reportPreferencesSchema.safeParse({
      tone: "warm",
      sections: ["quote"],
    });
    expect(result.success).toBe(true);
  });

  it("セクション空配列を拒否", () => {
    const result = reportPreferencesSchema.safeParse({
      tone: "warm",
      sections: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "セクションを最低1つ選択してください"
      );
    }
  });

  it("無効なセクション値を拒否", () => {
    const result = reportPreferencesSchema.safeParse({
      tone: "warm",
      sections: ["invalid_section"],
    });
    expect(result.success).toBe(false);
  });

  it("toneが欠けていると拒否", () => {
    const result = reportPreferencesSchema.safeParse({
      sections: ["highlight"],
    });
    expect(result.success).toBe(false);
  });

  it("sectionsが欠けていると拒否", () => {
    const result = reportPreferencesSchema.safeParse({
      tone: "warm",
    });
    expect(result.success).toBe(false);
  });
});
