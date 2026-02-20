"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { profileFormSchema, type ProfileFormValues } from "@/schemas/profile";
import { calcAge } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm<ProfileFormValues>({
      resolver: zodResolver(profileFormSchema),
      defaultValues: {
        child_name: "",
        child_birth_date: "",
      },
    });

  const birthDate = watch("child_birth_date");

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;

      const { data } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        reset({
          child_name: (data as { child_name: string | null }).child_name ?? "",
          child_birth_date:
            (data as { child_birth_date: string | null }).child_birth_date ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [reset]);

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("認証エラー");

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          child_name: values.child_name || null,
          child_birth_date: values.child_birth_date || null,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      toast.success("設定を保存しました");
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ページヘッダー */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Settings
        </p>
        <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
          設定
        </h1>
      </div>

      <div className="h-px bg-border/60" />

      {/* プロフィール設定カード */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
      >
        <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            お子さまの情報
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <Label
              htmlFor="child_name"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              お名前
            </Label>
            <Input
              id="child_name"
              placeholder="例: さくた"
              {...register("child_name")}
              className="border-border/60 bg-background/60 focus:border-primary/50"
            />
            {errors.child_name && (
              <p className="text-xs text-destructive">
                {errors.child_name.message}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              週次通信にお名前が入ります（任意）
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="child_birth_date"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              生年月日
            </Label>
            <Input
              id="child_birth_date"
              type="date"
              {...register("child_birth_date")}
              className="border-border/60 bg-background/60 focus:border-primary/50"
            />
            {birthDate && (
              <p className="text-sm text-primary font-medium">
                現在の月齢: {calcAge(birthDate)}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              月齢を自動計算して通信に反映します（任意）
            </p>
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
    </div>
  );
}
