/**
 * 写真ギャラリー用ユーティリティ
 */

export type PhotoItem = {
  logId: string;
  logDate: string;
  text: string;
  mood: string;
  childId: string;
  storagePath: string;
};

export type MonthGroup = {
  /** "2026-02" 形式 */
  key: string;
  /** "2026年2月" 形式 */
  label: string;
  photos: PhotoItem[];
};

/**
 * ログデータを月別にグルーピングする（降順）
 */
export function groupPhotosByMonth(
  logs: {
    id: string;
    log_date: string;
    text: string;
    mood: string;
    child_id: string;
    photo_storage_path: string;
  }[]
): MonthGroup[] {
  const map = new Map<string, PhotoItem[]>();

  for (const log of logs) {
    // log_date は "YYYY-MM-DD" 形式
    const key = log.log_date.slice(0, 7); // "YYYY-MM"
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push({
      logId: log.id,
      logDate: log.log_date,
      text: log.text,
      mood: log.mood,
      childId: log.child_id,
      storagePath: log.photo_storage_path,
    });
  }

  // 月キーを降順ソート
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => {
    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    return {
      key,
      label: `${year}年${month}月`,
      photos: map.get(key)!,
    };
  });
}
