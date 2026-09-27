import { describe, it, expect, afterEach, vi } from "vitest";
import {
  DEFAULT_GEMINI_MODEL,
  resolveGeminiModelName,
} from "@/lib/gemini/client";

describe("resolveGeminiModelName", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("GEMINI_MODEL 未設定時はデフォルトモデルを返す", () => {
    vi.stubEnv("GEMINI_MODEL", "");
    expect(resolveGeminiModelName()).toBe(DEFAULT_GEMINI_MODEL);
  });

  it("GEMINI_MODEL が設定されていればその値を返す", () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash-lite");
    expect(resolveGeminiModelName()).toBe("gemini-3.5-flash-lite");
  });

  it("前後の空白は取り除く", () => {
    vi.stubEnv("GEMINI_MODEL", "  gemini-3.6-flash ");
    expect(resolveGeminiModelName()).toBe("gemini-3.6-flash");
  });
});
