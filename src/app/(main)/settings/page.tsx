"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/schemas/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { display_name: "" },
  });

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;

      const { data: profile } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        profileForm.reset({
          display_name:
            (profile as { display_name: string | null }).display_name ?? "",
        });
      }

      setLoading(false);
    }
    load();
  }, [profileForm]);

  async function onSubmitProfile(values: ProfileFormValues) {
    setSavingProfile(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("認証エラー");

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          display_name: values.display_name || null,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      // family_members の display_name も更新
      await supabase
        .from("family_members")
        .update({ display_name: values.display_name || null })
        .eq("user_id", user.id);

      toast.success("プロフィールを保存しました");
    } catch (error) {
      toast.error("保存に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setSavingProfile(false);
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

      {/* あなたの情報 */}
      <form
        onSubmit={profileForm.handleSubmit(onSubmitProfile)}
        className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
      >
        <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            あなたの情報
          </p>
        </div>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <Label
              htmlFor="display_name"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              表示名
            </Label>
            <Input
              id="display_name"
              placeholder="例: パパ、ママ"
              {...profileForm.register("display_name")}
              className="border-border/60 bg-background/60 focus:border-primary/50"
            />
            <p className="text-[11px] text-muted-foreground">
              ログに表示される名前です
            </p>
          </div>
        </div>
        <div className="border-t border-border/40 bg-muted/20 px-5 py-3">
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
          >
            {savingProfile ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>

      {/* ログアウト（モバイルのみ） */}
      <div className="md:hidden">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-border/60 bg-card px-5 py-3.5 text-left text-sm text-destructive shadow-sm transition-colors hover:bg-destructive/5"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
