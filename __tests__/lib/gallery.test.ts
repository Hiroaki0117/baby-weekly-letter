import { describe, it, expect } from "vitest";
import { groupPhotosByMonth } from "@/lib/gallery";

function makeLog(overrides: {
  id?: string;
  log_date: string;
  text?: string;
  mood?: string;
  child_id?: string;
  photo_storage_path?: string;
}) {
  return {
    id: overrides.id ?? "log-1",
    log_date: overrides.log_date,
    text: overrides.text ?? "テスト",
    mood: overrides.mood ?? "happy",
    child_id: overrides.child_id ?? "child-1",
    photo_storage_path: overrides.photo_storage_path ?? "logs/test/photo.jpg",
  };
}

describe("groupPhotosByMonth", () => {
  it("空配列の場合は空配列を返す", () => {
    expect(groupPhotosByMonth([])).toEqual([]);
  });

  it("1件のログを正しくグルーピングする", () => {
    const logs = [makeLog({ log_date: "2026-02-14" })];
    const result = groupPhotosByMonth(logs);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("2026-02");
    expect(result[0].label).toBe("2026年2月");
    expect(result[0].photos).toHaveLength(1);
    expect(result[0].photos[0].logDate).toBe("2026-02-14");
  });

  it("同じ月のログをまとめる", () => {
    const logs = [
      makeLog({ id: "log-1", log_date: "2026-02-10" }),
      makeLog({ id: "log-2", log_date: "2026-02-20" }),
      makeLog({ id: "log-3", log_date: "2026-02-25" }),
    ];
    const result = groupPhotosByMonth(logs);

    expect(result).toHaveLength(1);
    expect(result[0].photos).toHaveLength(3);
  });

  it("複数月のログを降順でグルーピングする", () => {
    const logs = [
      makeLog({ id: "log-1", log_date: "2026-01-15" }),
      makeLog({ id: "log-2", log_date: "2026-03-01" }),
      makeLog({ id: "log-3", log_date: "2026-02-10" }),
    ];
    const result = groupPhotosByMonth(logs);

    expect(result).toHaveLength(3);
    expect(result[0].key).toBe("2026-03");
    expect(result[1].key).toBe("2026-02");
    expect(result[2].key).toBe("2026-01");
  });

  it("年をまたぐログを正しくグルーピングする", () => {
    const logs = [
      makeLog({ id: "log-1", log_date: "2025-12-25" }),
      makeLog({ id: "log-2", log_date: "2026-01-05" }),
    ];
    const result = groupPhotosByMonth(logs);

    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("2026-01");
    expect(result[0].label).toBe("2026年1月");
    expect(result[1].key).toBe("2025-12");
    expect(result[1].label).toBe("2025年12月");
  });

  it("ログのフィールドが正しくマッピングされる", () => {
    const logs = [
      makeLog({
        id: "abc-123",
        log_date: "2026-02-14",
        text: "バレンタイン",
        mood: "moved",
        child_id: "child-xyz",
        photo_storage_path: "logs/user1/abc/photo.jpg",
      }),
    ];
    const result = groupPhotosByMonth(logs);
    const photo = result[0].photos[0];

    expect(photo.logId).toBe("abc-123");
    expect(photo.logDate).toBe("2026-02-14");
    expect(photo.text).toBe("バレンタイン");
    expect(photo.mood).toBe("moved");
    expect(photo.childId).toBe("child-xyz");
    expect(photo.storagePath).toBe("logs/user1/abc/photo.jpg");
  });

  it("同じ月内のログの順序が入力順を維持する", () => {
    const logs = [
      makeLog({ id: "first", log_date: "2026-02-01" }),
      makeLog({ id: "second", log_date: "2026-02-15" }),
      makeLog({ id: "third", log_date: "2026-02-28" }),
    ];
    const result = groupPhotosByMonth(logs);
    const ids = result[0].photos.map((p) => p.logId);

    expect(ids).toEqual(["first", "second", "third"]);
  });
});
