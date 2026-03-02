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

export type GrowthRecord = Database["public"]["Tables"]["growth_records"]["Row"];
export type GrowthRecordInsert =
  Database["public"]["Tables"]["growth_records"]["Insert"];

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
