"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  childFormSchema,
  type ChildFormValues,
  profileFormSchema,
  type ProfileFormValues,
} from "@/schemas/profile";
import { calcAge } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberList } from "@/components/family/member-list";
import { InviteLink } from "@/components/family/invite-link";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingChild, setSavingChild] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { display_name: "" },
  });

  const childForm = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: { name: "", birth_date: "" },
  });

  const birthDate = childForm.watch("birth_date");

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // プロフィール取得
      const { data: profile } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        profileForm.reset({
          display_name:
            (profile as { display_name: string | null }).display_name ?? "",
        });
      }

      // 家族メンバー情報取得（ロール判定）
      const { data: member } = await client
        .from("family_members")
        .select("family_id, role")
        .eq("user_id", user.id)
        .single();

      if (member) {
        setFamilyId((member as { family_id: string }).family_id);
        setIsOwner((member as { role: string }).role === "owner");
      }

      // 子ども情報取得
      const { data: child } = await client
        .from("children")
        .select("*")
        .limit(1)
        .single();

      if (child) {
        const typedChild = child as {
          id: string;
          name: string | null;
          birth_date: string | null;
        };
        setChildId(typedChild.id);
        childForm.reset({
          name: typedChild.name ?? "",
          birth_date: typedChild.birth_date ?? "",
        });
      }

      setLoading(false);
    }
    load();
  }, [profileForm, childForm]);

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

  async function onSubmitChild(values: ChildFormValues) {
    setSavingChild(true);
    try {
      if (!familyId) throw new Error("家族が設定されていません");

      if (childId) {
        const { error } = await supabase
          .from("children")
          .update({
            name: values.name || null,
            birth_date: values.birth_date || null,
          })
          .eq("id", childId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("children")
          .insert({
            family_id: familyId,
            name: values.name || null,
            birth_date: values.birth_date || null,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setChildId((data as { id: string }).id);
      }

      toast.success("お子さまの情報を保存しました");
    } catch (error) {
      toast.error("保存に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setSavingChild(false);
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

      {/* お子さまの情報 */}
      <form
        onSubmit={childForm.handleSubmit(onSubmitChild)}
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
              {...childForm.register("name")}
              className="border-border/60 bg-background/60 focus:border-primary/50"
            />
            <p className="text-[11px] text-muted-foreground">
              通信にお名前が入ります（任意）
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
              {...childForm.register("birth_date")}
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
            disabled={savingChild}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
          >
            {savingChild ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>

      {/* 家族 */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            家族メンバー
          </p>
        </div>
        <div className="space-y-4 p-5">
          <MemberList isOwner={isOwner} currentUserId={currentUserId} />
          {isOwner && (
            <div className="border-t border-border/40 pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                パートナーを招待
              </p>
              <InviteLink />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
