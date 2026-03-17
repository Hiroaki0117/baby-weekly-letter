import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REPORT_PREFERENCES } from "@/types";
import type { ReportPreferences, ReportTone, ReportSection } from "@/types";

export async function fetchReportPreferences(): Promise<ReportPreferences> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_REPORT_PREFERENCES;

  const { data } = await supabase
    .from("report_preferences")
    .select("tone, sections")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return DEFAULT_REPORT_PREFERENCES;

  return {
    tone: data.tone as ReportTone,
    sections: data.sections as ReportSection[],
  };
}

export async function upsertReportPreferences(
  tone: ReportTone,
  sections: ReportSection[]
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("認証エラー");

  const { error } = await supabase.from("report_preferences").upsert(
    {
      user_id: user.id,
      tone,
      sections,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
