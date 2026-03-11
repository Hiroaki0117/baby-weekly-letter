"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcAge } from "@/lib/date";
import {
  fetchGrowthRecords,
  addGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
} from "@/lib/growth";
import {
  fetchTemperatureRecords,
  addTemperatureRecord,
  updateTemperatureRecord,
  deleteTemperatureRecord,
} from "@/lib/temperature";
import {
  fetchSleepRecords,
  addSleepRecord,
  updateSleepRecord,
  deleteSleepRecord,
  buildTimestamps,
  calcDurationMinutes,
  classifySleep,
} from "@/lib/sleep";
import {
  fetchMealRecords,
  addMealRecord,
  updateMealRecord,
  deleteMealRecord,
} from "@/lib/meal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberList } from "@/components/family/member-list";
import { InviteLink } from "@/components/family/invite-link";
import { GrowthRecordForm } from "@/components/growth/growth-record-form";
import { GrowthRecordList } from "@/components/growth/growth-record-list";
import { GrowthChart } from "@/components/stats/growth-chart";
import { TemperatureRecordForm } from "@/components/temperature/temperature-record-form";
import { TemperatureRecordList } from "@/components/temperature/temperature-record-list";
import { SleepRecordForm } from "@/components/sleep/sleep-record-form";
import { SleepRecordList } from "@/components/sleep/sleep-record-list";
import { MealRecordForm } from "@/components/meal/meal-record-form";
import { MealRecordList } from "@/components/meal/meal-record-list";
import { toast } from "sonner";
import type { Child, GrowthRecord, TemperatureRecord, SleepRecord, MealRecord, MealType, MealAmount, Gender } from "@/types";

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
  const [editGender, setEditGender] = useState<string>("");
  const [savingChild, setSavingChild] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newGender, setNewGender] = useState<string>("");
  // 成長記録
  const [growthRecords, setGrowthRecords] = useState<Record<string, GrowthRecord[]>>({});
  const [showGrowthForm, setShowGrowthForm] = useState<string | null>(null);
  const [editingGrowthRecord, setEditingGrowthRecord] = useState<GrowthRecord | null>(null);
  // 体温記録
  const [temperatureRecords, setTemperatureRecords] = useState<Record<string, TemperatureRecord[]>>({});
  const [showTempForm, setShowTempForm] = useState<string | null>(null);
  const [editingTempRecord, setEditingTempRecord] = useState<TemperatureRecord | null>(null);
  // 睡眠記録
  const [sleepRecords, setSleepRecords] = useState<Record<string, SleepRecord[]>>({});
  const [showSleepForm, setShowSleepForm] = useState<string | null>(null);
  const [editingSleepRecord, setEditingSleepRecord] = useState<SleepRecord | null>(null);
  // 食事記録
  const [mealRecords, setMealRecords] = useState<Record<string, MealRecord[]>>({});
  const [showMealForm, setShowMealForm] = useState<string | null>(null);
  const [editingMealRecord, setEditingMealRecord] = useState<MealRecord | null>(null);
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
        const kids = childrenRes.data as Child[];
        setChildrenList(kids);

        // 成長記録・体温記録・睡眠記録・食事記録を並行取得
        const growthMap: Record<string, GrowthRecord[]> = {};
        const tempMap: Record<string, TemperatureRecord[]> = {};
        const sleepMap: Record<string, SleepRecord[]> = {};
        const mealMap: Record<string, MealRecord[]> = {};
        await Promise.all(
          kids.map(async (child) => {
            try {
              growthMap[child.id] = await fetchGrowthRecords(client, child.id);
            } catch {
              growthMap[child.id] = [];
            }
            try {
              tempMap[child.id] = await fetchTemperatureRecords(client, child.id);
            } catch {
              tempMap[child.id] = [];
            }
            try {
              sleepMap[child.id] = await fetchSleepRecords(client, child.id);
            } catch {
              sleepMap[child.id] = [];
            }
            try {
              mealMap[child.id] = await fetchMealRecords(client, child.id);
            } catch {
              mealMap[child.id] = [];
            }
          })
        );
        setGrowthRecords(growthMap);
        setTemperatureRecords(tempMap);
        setSleepRecords(sleepMap);
        setMealRecords(mealMap);
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
    setEditGender(child.gender ?? "");
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
          gender: editGender || null,
        })
        .eq("id", editingChildId);
      if (error) throw error;

      setChildrenList((prev) =>
        prev.map((c) =>
          c.id === editingChildId
            ? { ...c, name: editName || null, birth_date: editBirthDate || null, gender: editGender || null }
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
          gender: newGender || null,
        })
        .select()
        .single();
      if (error) throw error;

      setChildrenList((prev) => [...prev, data as Child]);
      setShowAddForm(false);
      setNewName("");
      setNewBirthDate("");
      setNewGender("");
      toast.success("お子さまを追加しました");
    } catch {
      toast.error("追加に失敗しました");
    } finally {
      setSavingChild(false);
    }
  }

  // 成長記録ハンドラ
  const handleAddGrowth = useCallback(
    async (
      childId: string,
      data: { measured_date: string; height_cm: number | null; weight_kg: number | null }
    ) => {
      const record = await addGrowthRecord(supabase, {
        child_id: childId,
        measured_date: data.measured_date,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
      });
      setGrowthRecords((prev) => ({
        ...prev,
        [childId]: [...(prev[childId] ?? []), record].sort(
          (a, b) => a.measured_date.localeCompare(b.measured_date)
        ),
      }));
      setShowGrowthForm(null);
      setEditingGrowthRecord(null);
      toast.success("成長記録を追加しました");
    },
    [supabase]
  );

  const handleUpdateGrowth = useCallback(
    async (
      childId: string,
      recordId: string,
      data: { measured_date: string; height_cm: number | null; weight_kg: number | null }
    ) => {
      const updated = await updateGrowthRecord(supabase, recordId, {
        measured_date: data.measured_date,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
      });
      setGrowthRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? [])
          .map((r) => (r.id === recordId ? updated : r))
          .sort((a, b) => a.measured_date.localeCompare(b.measured_date)),
      }));
      setShowGrowthForm(null);
      setEditingGrowthRecord(null);
      toast.success("成長記録を更新しました");
    },
    [supabase]
  );

  const handleDeleteGrowth = useCallback(
    async (childId: string, recordId: string) => {
      await deleteGrowthRecord(supabase, recordId);
      setGrowthRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? []).filter((r) => r.id !== recordId),
      }));
      toast.success("成長記録を削除しました");
    },
    [supabase]
  );

  // 体温記録ハンドラ
  const handleAddTemp = useCallback(
    async (childId: string, data: { measured_at: string; temperature: number }) => {
      const record = await addTemperatureRecord(supabase, {
        child_id: childId,
        measured_at: data.measured_at,
        temperature: data.temperature,
      });
      setTemperatureRecords((prev) => ({
        ...prev,
        [childId]: [...(prev[childId] ?? []), record].sort(
          (a, b) => a.measured_at.localeCompare(b.measured_at)
        ),
      }));
      setShowTempForm(null);
      setEditingTempRecord(null);
      toast.success("体温記録を追加しました");
    },
    [supabase]
  );

  const handleUpdateTemp = useCallback(
    async (childId: string, recordId: string, data: { measured_at: string; temperature: number }) => {
      const updated = await updateTemperatureRecord(supabase, recordId, data);
      setTemperatureRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? [])
          .map((r) => (r.id === recordId ? updated : r))
          .sort((a, b) => a.measured_at.localeCompare(b.measured_at)),
      }));
      setShowTempForm(null);
      setEditingTempRecord(null);
      toast.success("体温記録を更新しました");
    },
    [supabase]
  );

  const handleDeleteTemp = useCallback(
    async (childId: string, recordId: string) => {
      await deleteTemperatureRecord(supabase, recordId);
      setTemperatureRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? []).filter((r) => r.id !== recordId),
      }));
      toast.success("体温記録を削除しました");
    },
    [supabase]
  );

  // 睡眠記録ハンドラ
  const handleAddSleep = useCallback(
    async (childId: string, data: { sleep_date: string; startTime: string; endTime: string }) => {
      const { startedAt, endedAt } = buildTimestamps(data.sleep_date, data.startTime, data.endTime);
      const duration = calcDurationMinutes(startedAt, endedAt);
      const record = await addSleepRecord(supabase, {
        child_id: childId,
        sleep_date: data.sleep_date,
        started_at: startedAt,
        ended_at: endedAt,
        duration_minutes: duration,
        sleep_category: classifySleep(startedAt),
      });
      setSleepRecords((prev) => ({
        ...prev,
        [childId]: [...(prev[childId] ?? []), record].sort(
          (a, b) => a.started_at.localeCompare(b.started_at)
        ),
      }));
      setShowSleepForm(null);
      setEditingSleepRecord(null);
      toast.success("睡眠記録を追加しました");
    },
    [supabase]
  );

  const handleUpdateSleep = useCallback(
    async (childId: string, recordId: string, data: { sleep_date: string; startTime: string; endTime: string }) => {
      const { startedAt, endedAt } = buildTimestamps(data.sleep_date, data.startTime, data.endTime);
      const duration = calcDurationMinutes(startedAt, endedAt);
      const updated = await updateSleepRecord(supabase, recordId, {
        sleep_date: data.sleep_date,
        started_at: startedAt,
        ended_at: endedAt,
        duration_minutes: duration,
        sleep_category: classifySleep(startedAt),
      });
      setSleepRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? [])
          .map((r) => (r.id === recordId ? updated : r))
          .sort((a, b) => a.started_at.localeCompare(b.started_at)),
      }));
      setShowSleepForm(null);
      setEditingSleepRecord(null);
      toast.success("睡眠記録を更新しました");
    },
    [supabase]
  );

  const handleDeleteSleep = useCallback(
    async (childId: string, recordId: string) => {
      await deleteSleepRecord(supabase, recordId);
      setSleepRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? []).filter((r) => r.id !== recordId),
      }));
      toast.success("睡眠記録を削除しました");
    },
    [supabase]
  );

  // 食事記録ハンドラ
  const handleAddMeal = useCallback(
    async (childId: string, data: { meal_date: string; meal_type: MealType; amount: MealAmount }) => {
      const record = await addMealRecord(supabase, {
        child_id: childId,
        meal_date: data.meal_date,
        meal_type: data.meal_type,
        amount: data.amount,
      });
      setMealRecords((prev) => ({
        ...prev,
        [childId]: [...(prev[childId] ?? []), record],
      }));
      setShowMealForm(null);
      setEditingMealRecord(null);
      toast.success("食事記録を追加しました");
    },
    [supabase]
  );

  const handleUpdateMeal = useCallback(
    async (childId: string, recordId: string, data: { meal_date: string; meal_type: MealType; amount: MealAmount }) => {
      const updated = await updateMealRecord(supabase, recordId, {
        meal_date: data.meal_date,
        meal_type: data.meal_type,
        amount: data.amount,
      });
      setMealRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? []).map((r) => (r.id === recordId ? updated : r)),
      }));
      setShowMealForm(null);
      setEditingMealRecord(null);
      toast.success("食事記録を更新しました");
    },
    [supabase]
  );

  const handleDeleteMeal = useCallback(
    async (childId: string, recordId: string) => {
      await deleteMealRecord(supabase, recordId);
      setMealRecords((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? []).filter((r) => r.id !== recordId),
      }));
      toast.success("食事記録を削除しました");
    },
    [supabase]
  );

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
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      性別
                    </Label>
                    <div className="flex gap-2">
                      {[
                        { value: "", label: "未設定" },
                        { value: "male", label: "男の子" },
                        { value: "female", label: "女の子" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditGender(opt.value)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            editGender === opt.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {child.name ?? "名前未設定"}
                        {child.gender && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            ({child.gender === "male" ? "男の子" : "女の子"})
                          </span>
                        )}
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

                  {/* 成長記録セクション */}
                  <div className="space-y-3 border-t border-border/30 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        成長記録
                      </p>
                      {showGrowthForm !== child.id && (
                        <button
                          onClick={() => {
                            setShowGrowthForm(child.id);
                            setEditingGrowthRecord(null);
                          }}
                          className="text-xs text-primary transition-colors hover:text-primary/80"
                        >
                          + 記録を追加
                        </button>
                      )}
                    </div>

                    {/* コンパクトグラフ */}
                    {child.birth_date && (growthRecords[child.id]?.length ?? 0) > 0 && (
                      <GrowthChart
                        records={growthRecords[child.id] ?? []}
                        birthDate={child.birth_date}
                        gender={(child.gender as Gender) ?? null}
                        compact
                      />
                    )}

                    {/* 入力フォーム */}
                    {showGrowthForm === child.id && (
                      <GrowthRecordForm
                        editingRecord={editingGrowthRecord}
                        onSubmit={async (data) => {
                          if (editingGrowthRecord) {
                            await handleUpdateGrowth(child.id, editingGrowthRecord.id, data);
                          } else {
                            await handleAddGrowth(child.id, data);
                          }
                        }}
                        onCancel={() => {
                          setShowGrowthForm(null);
                          setEditingGrowthRecord(null);
                        }}
                      />
                    )}

                    {/* 一覧 */}
                    <GrowthRecordList
                      records={growthRecords[child.id] ?? []}
                      onEdit={(record) => {
                        setShowGrowthForm(child.id);
                        setEditingGrowthRecord(record);
                      }}
                      onDelete={(id) => handleDeleteGrowth(child.id, id)}
                    />
                  </div>

                  {/* 体温記録セクション */}
                  <div className="space-y-3 border-t border-border/30 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        体温記録
                      </p>
                      {showTempForm !== child.id && (
                        <button
                          onClick={() => {
                            setShowTempForm(child.id);
                            setEditingTempRecord(null);
                          }}
                          className="text-xs text-primary transition-colors hover:text-primary/80"
                        >
                          + 記録を追加
                        </button>
                      )}
                    </div>

                    {showTempForm === child.id && (
                      <TemperatureRecordForm
                        editingRecord={editingTempRecord}
                        onSubmit={async (data) => {
                          if (editingTempRecord) {
                            await handleUpdateTemp(child.id, editingTempRecord.id, data);
                          } else {
                            await handleAddTemp(child.id, data);
                          }
                        }}
                        onCancel={() => {
                          setShowTempForm(null);
                          setEditingTempRecord(null);
                        }}
                      />
                    )}

                    <TemperatureRecordList
                      records={temperatureRecords[child.id] ?? []}
                      onEdit={(record) => {
                        setShowTempForm(child.id);
                        setEditingTempRecord(record);
                      }}
                      onDelete={(id) => handleDeleteTemp(child.id, id)}
                    />
                  </div>

                  {/* 睡眠記録セクション */}
                  <div className="space-y-3 border-t border-border/30 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        睡眠記録
                      </p>
                      {showSleepForm !== child.id && (
                        <button
                          onClick={() => {
                            setShowSleepForm(child.id);
                            setEditingSleepRecord(null);
                          }}
                          className="text-xs text-primary transition-colors hover:text-primary/80"
                        >
                          + 記録を追加
                        </button>
                      )}
                    </div>

                    {showSleepForm === child.id && (
                      <SleepRecordForm
                        editingRecord={editingSleepRecord}
                        onSubmit={async (data) => {
                          if (editingSleepRecord) {
                            await handleUpdateSleep(child.id, editingSleepRecord.id, data);
                          } else {
                            await handleAddSleep(child.id, data);
                          }
                        }}
                        onCancel={() => {
                          setShowSleepForm(null);
                          setEditingSleepRecord(null);
                        }}
                      />
                    )}

                    <SleepRecordList
                      records={sleepRecords[child.id] ?? []}
                      onEdit={(record) => {
                        setShowSleepForm(child.id);
                        setEditingSleepRecord(record);
                      }}
                      onDelete={(id) => handleDeleteSleep(child.id, id)}
                    />
                  </div>

                  {/* 食事記録セクション */}
                  <div className="space-y-3 border-t border-border/30 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        食事記録
                      </p>
                      {showMealForm !== child.id && (
                        <button
                          onClick={() => {
                            setShowMealForm(child.id);
                            setEditingMealRecord(null);
                          }}
                          className="text-xs text-primary transition-colors hover:text-primary/80"
                        >
                          + 記録を追加
                        </button>
                      )}
                    </div>

                    {showMealForm === child.id && (
                      <MealRecordForm
                        editingRecord={editingMealRecord}
                        onSubmit={async (data) => {
                          if (editingMealRecord) {
                            await handleUpdateMeal(child.id, editingMealRecord.id, data);
                          } else {
                            await handleAddMeal(child.id, data);
                          }
                        }}
                        onCancel={() => {
                          setShowMealForm(null);
                          setEditingMealRecord(null);
                        }}
                      />
                    )}

                    <MealRecordList
                      records={mealRecords[child.id] ?? []}
                      onEdit={(record) => {
                        setShowMealForm(child.id);
                        setEditingMealRecord(record);
                      }}
                      onDelete={(id) => handleDeleteMeal(child.id, id)}
                    />
                  </div>
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
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  性別
                </Label>
                <div className="flex gap-2">
                  {[
                    { value: "", label: "未設定" },
                    { value: "male", label: "男の子" },
                    { value: "female", label: "女の子" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewGender(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        newGender === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                    setNewGender("");
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
