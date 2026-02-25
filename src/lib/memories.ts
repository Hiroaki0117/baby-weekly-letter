import type { DailyLog } from "@/types";

export type YearGroup = {
  /** 何年前か（1, 2, 3...） */
  yearsAgo: number;
  /** "1年前の今日" */
  label: string;
  /** "2025-02-25" */
  date: string;
  /** "2025年2月25日" */
  dateLabel: string;
  logs: DailyLog[];
};

/**
 * 過去の同月同日のログ候補日を生成する（1年前〜maxYears年前）
 */
export function getCandidateDates(
  today: Date,
  maxYears: number = 5
): string[] {
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dates: string[] = [];

  for (let y = 1; y <= maxYears; y++) {
    const pastYear = today.getFullYear() - y;
    // うるう年対策: 2/29 の場合、平年は候補に含めない
    if (month === "02" && day === "29") {
      if (!isLeapYear(pastYear)) continue;
    }
    dates.push(`${pastYear}-${month}-${day}`);
  }

  return dates;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * ログを年別にグルーピングする（yearsAgo の昇順）
 */
export function groupMemoriesByYear(
  logs: DailyLog[],
  today: Date
): YearGroup[] {
  const currentYear = today.getFullYear();
  const map = new Map<number, DailyLog[]>();

  for (const log of logs) {
    const logYear = parseInt(log.log_date.slice(0, 4), 10);
    const yearsAgo = currentYear - logYear;
    if (yearsAgo < 1) continue;

    if (!map.has(yearsAgo)) {
      map.set(yearsAgo, []);
    }
    map.get(yearsAgo)!.push(log);
  }

  const sortedKeys = [...map.keys()].sort((a, b) => a - b);

  return sortedKeys.map((yearsAgo) => {
    const logs = map.get(yearsAgo)!;
    const logDate = logs[0].log_date;
    const [yearStr, monthStr, dayStr] = logDate.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    return {
      yearsAgo,
      label: `${yearsAgo}年前の今日`,
      date: logDate,
      dateLabel: `${year}年${month}月${day}日`,
      logs,
    };
  });
}
