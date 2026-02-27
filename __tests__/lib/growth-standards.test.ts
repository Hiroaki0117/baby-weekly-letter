import { describe, it, expect } from "vitest";
import {
  maleHeight,
  maleWeight,
  femaleHeight,
  femaleWeight,
} from "@/lib/growth-standards";

describe("growth-standards", () => {
  const datasets = [
    { name: "maleHeight", data: maleHeight },
    { name: "maleWeight", data: maleWeight },
    { name: "femaleHeight", data: femaleHeight },
    { name: "femaleWeight", data: femaleWeight },
  ];

  for (const { name, data } of datasets) {
    describe(name, () => {
      it("データが存在する", () => {
        expect(data.length).toBeGreaterThan(0);
      });

      it("0ヶ月から始まる", () => {
        expect(data[0].monthAge).toBe(0);
      });

      it("72ヶ月で終わる", () => {
        expect(data[data.length - 1].monthAge).toBe(72);
      });

      it("月齢が昇順に並んでいる", () => {
        for (let i = 1; i < data.length; i++) {
          expect(data[i].monthAge).toBeGreaterThan(data[i - 1].monthAge);
        }
      });

      it("各パーセンタイルが p3 < p10 < p25 < p50 < p75 < p90 < p97 の順", () => {
        for (const entry of data) {
          expect(entry.p3).toBeLessThan(entry.p10);
          expect(entry.p10).toBeLessThan(entry.p25);
          expect(entry.p25).toBeLessThan(entry.p50);
          expect(entry.p50).toBeLessThan(entry.p75);
          expect(entry.p75).toBeLessThan(entry.p90);
          expect(entry.p90).toBeLessThan(entry.p97);
        }
      });

      it("値が月齢とともに増加する傾向がある（p50）", () => {
        // 最初と最後でp50が増加していることを確認
        expect(data[data.length - 1].p50).toBeGreaterThan(data[0].p50);
      });
    });
  }

  it("男児の身長p50が出生時約49cm", () => {
    expect(maleHeight[0].p50).toBeGreaterThanOrEqual(48);
    expect(maleHeight[0].p50).toBeLessThanOrEqual(51);
  });

  it("男児の体重p50が出生時約3.0kg", () => {
    expect(maleWeight[0].p50).toBeGreaterThanOrEqual(2.5);
    expect(maleWeight[0].p50).toBeLessThanOrEqual(3.5);
  });

  it("女児の身長p50が出生時約48.5cm", () => {
    expect(femaleHeight[0].p50).toBeGreaterThanOrEqual(47);
    expect(femaleHeight[0].p50).toBeLessThanOrEqual(50);
  });

  it("女児の体重p50が出生時約2.9kg", () => {
    expect(femaleWeight[0].p50).toBeGreaterThanOrEqual(2.5);
    expect(femaleWeight[0].p50).toBeLessThanOrEqual(3.5);
  });
});
