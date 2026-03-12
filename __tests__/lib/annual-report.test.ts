import { describe, it, expect } from "vitest";
import {
  getFiscalYearRange,
  canGenerate,
  isInCooldown,
  getCooldownRemaining,
} from "@/lib/annual-report/data";

describe("getFiscalYearRange", () => {
  it("2025年度は2025-04-01から2026-03-31", () => {
    const range = getFiscalYearRange(2025);
    expect(range.start).toBe("2025-04-01");
    expect(range.end).toBe("2026-03-31");
  });

  it("2024年度は2024-04-01から2025-03-31", () => {
    const range = getFiscalYearRange(2024);
    expect(range.start).toBe("2024-04-01");
    expect(range.end).toBe("2025-03-31");
  });
});

describe("canGenerate", () => {
  it("2025年度: 2026-03-01以降なら生成可能", () => {
    expect(canGenerate(2025, new Date("2026-03-01T00:00:00"))).toBe(true);
  });

  it("2025年度: 2026-03-15でも生成可能", () => {
    expect(canGenerate(2025, new Date("2026-03-15T00:00:00"))).toBe(true);
  });

  it("2025年度: 2026-04-01でも生成可能（過去年度）", () => {
    expect(canGenerate(2025, new Date("2026-04-01T00:00:00"))).toBe(true);
  });

  it("2025年度: 2026-02-28は生成不可", () => {
    expect(canGenerate(2025, new Date("2026-02-28T23:59:59"))).toBe(false);
  });

  it("2025年度: 2025-12-01は生成不可", () => {
    expect(canGenerate(2025, new Date("2025-12-01T00:00:00"))).toBe(false);
  });
});

// NOTE: クールダウンは開発用に無効化中（COOLDOWN_MS = 0）
// 本番リリース時に COOLDOWN_MS を 24h に戻したらテストも元に戻すこと
describe("isInCooldown", () => {
  it("クールダウン無効化中は常にfalse", () => {
    const now = new Date("2026-03-10T23:00:00Z");
    const generatedAt = "2026-03-10T01:00:00Z";
    expect(isInCooldown(generatedAt, now)).toBe(false);
  });

  it("生成から25時間後はクールダウン外", () => {
    const now = new Date("2026-03-11T02:00:00Z");
    const generatedAt = "2026-03-10T00:00:00Z";
    expect(isInCooldown(generatedAt, now)).toBe(false);
  });

  it("生成直後もクールダウン無効化中はfalse", () => {
    const now = new Date("2026-03-10T00:00:00Z");
    const generatedAt = "2026-03-10T00:00:00Z";
    expect(isInCooldown(generatedAt, now)).toBe(false);
  });

  it("ちょうど24時間後はクールダウン外", () => {
    const now = new Date("2026-03-11T00:00:00Z");
    const generatedAt = "2026-03-10T00:00:00Z";
    expect(isInCooldown(generatedAt, now)).toBe(false);
  });
});

describe("getCooldownRemaining", () => {
  it("クールダウン無効化中は常に0を返す", () => {
    const now = new Date("2026-03-10T22:00:00Z");
    const generatedAt = "2026-03-10T00:00:00Z";
    const remaining = getCooldownRemaining(generatedAt, now);
    expect(remaining).toBe(0);
  });

  it("クールダウン外は0を返す", () => {
    const now = new Date("2026-03-11T01:00:00Z");
    const generatedAt = "2026-03-10T00:00:00Z";
    expect(getCooldownRemaining(generatedAt, now)).toBe(0);
  });
});
