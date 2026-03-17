import type { Database } from "./database";

export type Family = Database["public"]["Tables"]["families"]["Row"];
export type FamilyInsert = Database["public"]["Tables"]["families"]["Insert"];

export type FamilyMember =
  Database["public"]["Tables"]["family_members"]["Row"];
export type FamilyMemberInsert =
  Database["public"]["Tables"]["family_members"]["Insert"];

export type Child = Database["public"]["Tables"]["children"]["Row"];
export type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];
export type ChildUpdate = Database["public"]["Tables"]["children"]["Update"];

export type FamilyInvitation =
  Database["public"]["Tables"]["family_invitations"]["Row"];
export type FamilyInvitationInsert =
  Database["public"]["Tables"]["family_invitations"]["Insert"];

export type LogReaction = Database["public"]["Tables"]["log_reactions"]["Row"];

export type LogComment = Database["public"]["Tables"]["log_comments"]["Row"];
export type LogCommentInsert = Database["public"]["Tables"]["log_comments"]["Insert"];

export type GrowthRecord = Database["public"]["Tables"]["growth_records"]["Row"];
export type GrowthRecordInsert =
  Database["public"]["Tables"]["growth_records"]["Insert"];

export type TemperatureRecord = Database["public"]["Tables"]["temperature_records"]["Row"];
export type TemperatureRecordInsert =
  Database["public"]["Tables"]["temperature_records"]["Insert"];

export type TempPeriod = "morning" | "afternoon" | "evening" | "night";

export const TEMP_PERIOD_OPTIONS: { value: TempPeriod; label: string }[] = [
  { value: "morning", label: "朝" },
  { value: "afternoon", label: "昼" },
  { value: "evening", label: "夕" },
  { value: "night", label: "夜" },
];

/** 体温時間帯ごとのデフォルト計測時刻（時） */
export const TEMP_PERIOD_DEFAULT_HOUR: Record<TempPeriod, number> = {
  morning: 7,
  afternoon: 12,
  evening: 17,
  night: 21,
};

/** 発熱の閾値（℃） */
export const FEVER_THRESHOLD = 37.5;

export type SleepRecord = Database["public"]["Tables"]["sleep_records"]["Row"];
export type SleepRecordInsert = Database["public"]["Tables"]["sleep_records"]["Insert"];

export type SleepTracking = Database["public"]["Tables"]["sleep_tracking"]["Row"];
export type SleepTrackingInsert = Database["public"]["Tables"]["sleep_tracking"]["Insert"];

export type SleepCategory = "night" | "daytime";

export const SLEEP_CATEGORY_OPTIONS: { value: SleepCategory; label: string }[] = [
  { value: "night", label: "夜間睡眠" },
  { value: "daytime", label: "日中睡眠" },
];

/** 睡眠カテゴリごとのデフォルト開始・終了時刻 */
export const SLEEP_DEFAULT_TIMES: Record<SleepCategory, { start: string; end: string }> = {
  night: { start: "21:00", end: "06:00" },
  daytime: { start: "13:00", end: "15:00" },
};

export type MealRecord = Database["public"]["Tables"]["meal_records"]["Row"];
export type MealRecordInsert = Database["public"]["Tables"]["meal_records"]["Insert"];

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealAmount = "plenty" | "normal" | "little" | "none";

export const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "おやつ" },
];

export const MEAL_AMOUNT_OPTIONS: { value: MealAmount; label: string }[] = [
  { value: "plenty", label: "よく食べた" },
  { value: "normal", label: "ふつう" },
  { value: "little", label: "少なめ" },
  { value: "none", label: "食べなかった" },
];

export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
export type MilestoneInsert = Database["public"]["Tables"]["milestones"]["Insert"];
export type MilestoneUpdate = Database["public"]["Tables"]["milestones"]["Update"];

export type PushSubscriptionRecord = Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type PushSubscriptionInsert = Database["public"]["Tables"]["push_subscriptions"]["Insert"];

export type NotificationSettings = Database["public"]["Tables"]["notification_settings"]["Row"];
export type NotificationSettingsInsert = Database["public"]["Tables"]["notification_settings"]["Insert"];

export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];
export type AppNotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationType = "auto_weekly" | "auto_monthly" | "auto_annual" | "reaction" | "comment";

export type Gender = "male" | "female";

export type ReportTone = "warm" | "humor" | "neutral" | "poetic";
export type ReportSection = "highlight" | "digest" | "growth" | "encouragement" | "quote";

export type ReportPreferences = {
  tone: ReportTone;
  sections: ReportSection[];
};

export const TONE_OPTIONS: { value: ReportTone; label: string; description: string }[] = [
  { value: "warm", label: "ほっこり系", description: "温かみのある手紙調" },
  { value: "humor", label: "ユーモア系", description: "明るくユーモアを交えた文体" },
  { value: "neutral", label: "淡々記録系", description: "落ち着いた客観的なトーン" },
  { value: "poetic", label: "ポエム系", description: "詩的で情緒豊かな文体" },
];

export const SECTION_OPTIONS: { value: ReportSection; label: string; description: string; defaultOn: boolean }[] = [
  { value: "highlight", label: "今週のハイライト", description: "印象的なエピソードを1つ深掘り", defaultOn: true },
  { value: "digest", label: "日々のダイジェスト", description: "各日の出来事を短くまとめ", defaultOn: true },
  { value: "growth", label: "成長メモ", description: "前回と比較した変化", defaultOn: true },
  { value: "encouragement", label: "親へのひとこと", description: "書き手（親）への労いの言葉", defaultOn: false },
  { value: "quote", label: "今週の名言", description: "ログから印象的な一言を引用", defaultOn: false },
];

export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
export type DailyLogWithAuthor = DailyLog & { authorDisplayName?: string | null };
export type DailyLogInsert =
  Database["public"]["Tables"]["daily_logs"]["Insert"];
export type DailyLogUpdate =
  Database["public"]["Tables"]["daily_logs"]["Update"];

export type WeeklyReport =
  Database["public"]["Tables"]["weekly_reports"]["Row"];
export type WeeklyReportInsert =
  Database["public"]["Tables"]["weekly_reports"]["Insert"];

export type MonthlyReport =
  Database["public"]["Tables"]["monthly_reports"]["Row"];
export type MonthlyReportInsert =
  Database["public"]["Tables"]["monthly_reports"]["Insert"];

export type AnnualReportContent = {
  coverTitle: string;
  childAge: string;
  monthHighlights: {
    month: number;
    text: string;
    photoPath: string | null;
  }[];
  milestones: {
    title: string;
    date: string;
  }[];
  growthSummary: {
    startHeight: number | null;
    endHeight: number | null;
    startWeight: number | null;
    endWeight: number | null;
  } | null;
  closingMessage: string;
};

export type AnnualReport = {
  id: string;
  family_id: string;
  child_id: string;
  fiscal_year: number;
  content: AnnualReportContent;
  generated_at: string;
  created_at: string;
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Mood = "moved" | "happy" | "neutral" | "tired" | "sad";

export const MOOD_OPTIONS: { value: Mood; emoji: string; label: string }[] = [
  { value: "moved",   emoji: "🥰", label: "感動した" },
  { value: "happy",   emoji: "🙂", label: "いい日" },
  { value: "neutral", emoji: "😐", label: "ふつう" },
  { value: "tired",   emoji: "😴", label: "疲れた" },
  { value: "sad",     emoji: "😭", label: "大変だった" },
];

export type Category = {
  value: string;
  label: string;
};

export const CATEGORY_OPTIONS: Category[] = [
  { value: "meal", label: "食事" },
  { value: "sleep", label: "睡眠" },
  { value: "play", label: "遊び" },
  { value: "word", label: "ことば" },
  { value: "motor", label: "運動" },
  { value: "health", label: "体調" },
  { value: "growth", label: "成長" },
  { value: "parent_feeling", label: "パパ/ママの気持ち" },
];

// ===== カレンダー定数 =====

/** 日〜土の曜日ラベル（日曜始まり） */
export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 月〜日の曜日ラベル（月曜始まり、カレンダーグリッド用） */
export const CAL_WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

/** 月名ラベル（1〜12） */
export const MONTH_NAMES: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

/** 年度順の月（4月始まり） */
export const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;
