"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  reportPreferencesSchema,
  type ReportPreferencesFormValues,
} from "@/schemas/report-preferences";
import {
  TONE_OPTIONS,
  SECTION_OPTIONS,
  type ReportTone,
  type ReportSection,
} from "@/types";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DEFAULT_TONE: ReportTone = "warm";
const DEFAULT_SECTIONS: ReportSection[] = ["highlight", "digest", "growth"];

export function ReportPreferencesForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const form = useForm<ReportPreferencesFormValues>({
    resolver: zodResolver(reportPreferencesSchema),
    defaultValues: {
      tone: DEFAULT_TONE,
      sections: DEFAULT_SECTIONS,
    },
  });

  const watchedSections = form.watch("sections");

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await client
        .from("report_preferences")
        .select("tone, sections")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        form.reset({
          tone: data.tone as ReportTone,
          sections: data.sections as ReportSection[],
        });
      }

      setLoading(false);
    }
    load();
  }, [form]);

  async function onSubmit(values: ReportPreferencesFormValues) {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("認証エラー");

      const { error } = await supabase.from("report_preferences").upsert(
        {
          user_id: user.id,
          tone: values.tone,
          sections: values.sections,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast.success("通信設定を保存しました");
    } catch (error) {
      toast.error("保存に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            通信設定
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
    >
      <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          通信設定
        </p>
      </div>
      <div className="space-y-6 p-5">
        {/* トーン選択 */}
        <div className="space-y-3">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            文体トーン
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((opt) => {
              const isSelected = form.watch("tone") === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={opt.value}
                      {...form.register("tone")}
                      className="sr-only"
                    />
                    <div
                      className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && (
                        <div className="m-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <p className="mt-1 pl-5.5 text-[11px] text-muted-foreground">
                    {opt.description}
                  </p>
                </label>
              );
            })}
          </div>
        </div>

        {/* セクション構成 */}
        <div className="space-y-3">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            セクション構成
          </Label>
          <p className="text-[11px] text-muted-foreground">
            通信に含めるセクションを選択してください（最低1つ）
          </p>
          <div className="space-y-2">
            {SECTION_OPTIONS.map((opt) => {
              const isChecked = watchedSections?.includes(opt.value) ?? false;
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    isChecked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={isChecked}
                    onChange={(e) => {
                      const current = form.getValues("sections");
                      if (e.target.checked) {
                        form.setValue("sections", [...current, opt.value], {
                          shouldValidate: true,
                        });
                      } else {
                        form.setValue(
                          "sections",
                          current.filter((s) => s !== opt.value),
                          { shouldValidate: true }
                        );
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-muted-foreground/40 text-primary focus:ring-primary/30"
                  />
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isChecked ? "text-foreground" : "text-foreground/80"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          {form.formState.errors.sections && (
            <p className="text-xs text-destructive">
              {form.formState.errors.sections.message}
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-border/40 bg-muted/20 px-5 py-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
