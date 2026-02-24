"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  childFormSchema,
  type ChildFormValues,
} from "@/schemas/profile";
import { calcAge } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberList } from "@/components/family/member-list";
import { InviteLink } from "@/components/family/invite-link";
import { toast } from "sonner";

export default function FamilyPage() {
  const [loading, setLoading] = useState(true);
  const [savingChild, setSavingChild] = useState(false);
  const [savingFamilyName, setSavingFamilyName] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [editingFamilyName, setEditingFamilyName] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState("");
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

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

      // family_id を RPC で取得
      const { data: myFamilyId } = await client.rpc("my_family_id");
      if (!myFamilyId) {
        setLoading(false);
        return;
      }
      setFamilyId(myFamilyId as string);

      // 並列で取得
      const [memberRes, familyRes, childRes] = await Promise.all([
        client
          .from("family_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("family_id", myFamilyId as string)
          .maybeSingle(),
        client
          .from("families")
          .select("name")
          .eq("id", myFamilyId as string)
          .maybeSingle(),
        client
          .from("children")
          .select("*")
          .eq("family_id", myFamilyId as string)
          .limit(1)
          .maybeSingle(),
      ]);

      if (memberRes.data) {
        setIsOwner(
          (memberRes.data as { role: string }).role === "owner"
        );
      }

      if (familyRes.data) {
        const name = (familyRes.data as { name: string }).name;
        setFamilyName(name);
        setFamilyNameInput(name);
      }

      if (childRes.data) {
        const child = childRes.data as {
          id: string;
          name: string | null;
          birth_date: string | null;
        };
        setChildId(child.id);
        childForm.reset({
          name: child.name ?? "",
          birth_date: child.birth_date ?? "",
        });
      }

      setLoading(false);
    }
    load();
  }, [childForm]);

  async function handleSaveFamilyName() {
    if (!familyId || !familyNameInput.trim()) return;
    setSavingFamilyName(true);
    try {
      const { error } = await supabase
        .from("families")
        .update({ name: familyNameInput.trim() })
        .eq("id", familyId);

      if (error) throw error;

      setFamilyName(familyNameInput.trim());
      setEditingFamilyName(false);
      toast.success("家族名を更新しました");
    } catch {
      toast.error("家族名の更新に失敗しました");
    } finally {
      setSavingFamilyName(false);
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
          Family
        </p>
        <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
          家族
        </h1>
      </div>

      <div className="h-px bg-border/60" />

      {/* 家族名 */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            家族名
          </p>
        </div>
        <div className="p-5">
          {editingFamilyName ? (
            <div className="flex items-center gap-3">
              <Input
                value={familyNameInput}
                onChange={(e) => setFamilyNameInput(e.target.value)}
                className="flex-1 border-border/60 bg-background/60 focus:border-primary/50"
              />
              <button
                onClick={handleSaveFamilyName}
                disabled={savingFamilyName || !familyNameInput.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {savingFamilyName ? "保存中..." : "保存"}
              </button>
              <button
                onClick={() => {
                  setFamilyNameInput(familyName);
                  setEditingFamilyName(false);
                }}
                className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-mincho text-lg font-semibold text-foreground">
                {familyName}
              </p>
              {isOwner && (
                <button
                  onClick={() => setEditingFamilyName(true)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  編集
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* 家族メンバー */}
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
