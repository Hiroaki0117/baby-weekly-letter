"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcAge } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberList } from "@/components/family/member-list";
import { InviteLink } from "@/components/family/invite-link";
import { toast } from "sonner";
import type { Child } from "@/types";

export default function FamilyPage() {
  const [loading, setLoading] = useState(true);
  const [savingFamilyName, setSavingFamilyName] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [editingFamilyName, setEditingFamilyName] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState("");
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [savingChild, setSavingChild] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: myFamilyId } = await client.rpc("my_family_id");
      if (!myFamilyId) {
        setLoading(false);
        return;
      }
      setFamilyId(myFamilyId as string);

      const [memberRes, familyRes, childrenRes] = await Promise.all([
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
          .order("created_at", { ascending: true }),
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

      if (childrenRes.data) {
        setChildrenList(childrenRes.data as Child[]);
      }

      setLoading(false);
    }
    load();
  }, []);

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

  function startEditChild(child: Child) {
    setEditingChildId(child.id);
    setEditName(child.name ?? "");
    setEditBirthDate(child.birth_date ?? "");
  }

  async function handleSaveChild() {
    if (!editingChildId) return;
    setSavingChild(true);
    try {
      const { error } = await supabase
        .from("children")
        .update({
          name: editName || null,
          birth_date: editBirthDate || null,
        })
        .eq("id", editingChildId);
      if (error) throw error;

      setChildrenList((prev) =>
        prev.map((c) =>
          c.id === editingChildId
            ? { ...c, name: editName || null, birth_date: editBirthDate || null }
            : c
        )
      );
      setEditingChildId(null);
      toast.success("お子さまの情報を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSavingChild(false);
    }
  }

  async function handleAddChild() {
    if (!familyId) return;
    setSavingChild(true);
    try {
      const { data, error } = await supabase
        .from("children")
        .insert({
          family_id: familyId,
          name: newName || null,
          birth_date: newBirthDate || null,
        })
        .select()
        .single();
      if (error) throw error;

      setChildrenList((prev) => [...prev, data as Child]);
      setShowAddForm(false);
      setNewName("");
      setNewBirthDate("");
      toast.success("お子さまを追加しました");
    } catch {
      toast.error("追加に失敗しました");
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
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Family
          </p>
          <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
            家族
          </h1>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Settings size={14} />
          設定
        </Link>
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

      {/* お子さま一覧 */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            お子さま
          </p>
        </div>
        <div className="divide-y divide-border/30">
          {childrenList.map((child) => (
            <div key={child.id} className="p-5">
              {editingChildId === child.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      お名前
                    </Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="例: さくた"
                      className="border-border/60 bg-background/60 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      生年月日
                    </Label>
                    <Input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="border-border/60 bg-background/60 focus:border-primary/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveChild}
                      disabled={savingChild}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      {savingChild ? "保存中..." : "保存"}
                    </button>
                    <button
                      onClick={() => setEditingChildId(null)}
                      className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {child.name ?? "名前未設定"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {child.birth_date
                        ? `${child.birth_date} ・ ${calcAge(child.birth_date)}`
                        : "生年月日未設定"}
                    </p>
                  </div>
                  <button
                    onClick={() => startEditChild(child)}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    編集
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 追加フォーム */}
          {showAddForm ? (
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  お名前
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例: さくた"
                  className="border-border/60 bg-background/60 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  生年月日
                </Label>
                <Input
                  type="date"
                  value={newBirthDate}
                  onChange={(e) => setNewBirthDate(e.target.value)}
                  className="border-border/60 bg-background/60 focus:border-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddChild}
                  disabled={savingChild}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingChild ? "追加中..." : "追加する"}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewName("");
                    setNewBirthDate("");
                  }}
                  className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 text-xs">
                  +
                </span>
                お子さまを追加
              </button>
            </div>
          )}
        </div>
      </div>

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
