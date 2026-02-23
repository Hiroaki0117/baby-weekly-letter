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

export type Mood = "happy" | "neutral" | "sad";

export const MOOD_OPTIONS: { value: Mood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "🙂", label: "いい日" },
  { value: "neutral", emoji: "😐", label: "ふつう" },
  { value: "sad", emoji: "😭", label: "大変だった" },
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
