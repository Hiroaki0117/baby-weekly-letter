"use client";

import { useState, useEffect, useRef } from "react";
import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  addSleepRecord,
  buildTimestamps,
  calcDurationMinutes,
  classifySleep,
  startTracking,
  stopTracking,
  updateTracking,
} from "@/lib/sleep";
import { getMyFamilyId } from "@/lib/supabase/family";
import { toast } from "sonner";
import { ChildSelector } from "@/components/child/child-selector";
import type { Child, SleepTracking } from "@/types";

type Props = {
  childrenList: Child[];
  activeTracking: SleepTracking[];
  onTrackingChange: () => void;
};

function getDefaultDate(): string {
  const now = new Date();
  // 午前中なら昨日（前夜の睡眠記録を想定）、午後なら今日
  if (now.getHours() < 12) {
    return format(subDays(now, 1), "yyyy-MM-dd");
  }
  return format(now, "yyyy-MM-dd");
}

function nowTime(): string {
  return format(new Date(), "HH:mm");
}

function calcPreview(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}時間${mins}分`;
  if (hours > 0) return `${hours}時間`;
  return `${mins}分`;
}

function formatTrackingStartTime(startedAt: string): { date: string; time: string } {
  const d = new Date(startedAt);
  return {
    date: format(d, "yyyy-MM-dd"),
    time: format(d, "HH:mm"),
  };
}

export function QuickSleepInput({ childrenList, activeTracking, onTrackingChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id ?? "");
  const [sleepDate, setSleepDate] = useState(getDefaultDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingTrackingId, setConfirmingTrackingId] = useState<string | null>(null);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const supabaseRef = useRef(createClient());

  // childrenList が後から渡された場合に同期
  useEffect(() => {
    if (!selectedChildId && childrenList.length > 0) {
      setSelectedChildId(childrenList[0].id);
    }
  }, [childrenList, selectedChildId]);

  if (childrenList.length === 0) return null;

  const showSelector = childrenList.length >= 2;

  // アクティブな計測（子供ごとに1つ）
  const currentTracking = activeTracking.find((t) => t.child_id === selectedChildId);
  const hasAnyTracking = activeTracking.length > 0;

  // 「開始」ボタン
  async function handleSleepStart(childId: string) {
    setSaving(true);
    try {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("認証エラー");

      const familyId = await getMyFamilyId(supabase);
      if (!familyId) throw new Error("家族が設定されていません");

      const now = new Date();
      await startTracking(supabase, {
        family_id: familyId,
        child_id: childId,
        started_by: user.id,
        started_at: now.toISOString(),
        sleep_date: format(now, "yyyy-MM-dd"),
      });

      const child = childrenList.find((c) => c.id === childId);
      toast.success(`${child?.name ?? ""}の睡眠記録を開始しました（${format(now, "HH:mm")}）`);
      onTrackingChange();
    } catch (e) {
      toast.error("開始に失敗しました", {
        description: e instanceof Error ? e.message : "不明なエラー",
      });
    } finally {
      setSaving(false);
    }
  }

  // 「終了」ボタン → 確認画面へ
  function handleWakeUp(tracking: SleepTracking) {
    const { date, time } = formatTrackingStartTime(tracking.started_at);
    setSleepDate(date);
    setStartTime(time);
    setEndTime(nowTime());
    setConfirmingTrackingId(tracking.id);
  }

  // 記録中をキャンセル
  async function handleCancelTracking(trackingId: string) {
    setSaving(true);
    try {
      await stopTracking(supabaseRef.current, trackingId);
      setConfirmingTrackingId(null);
      setEndTime("");
      onTrackingChange();
      toast.success("計測を取り消しました");
    } catch {
      toast.error("取消に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  // 開始時刻を編集して保存
  async function handleSaveEditedStartTime(trackingId: string) {
    if (!editDate || !editTime) return;

    setSaving(true);
    try {
      const startedAt = new Date(`${editDate}T${editTime}:00`).toISOString();
      await updateTracking(supabaseRef.current, trackingId, {
        started_at: startedAt,
        sleep_date: editDate,
      });
      toast.success("開始時刻を修正しました");
      setEditingTrackingId(null);
      onTrackingChange();
    } catch {
      toast.error("開始時刻の修正に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  // 確認画面から保存
  async function handleRecord(tracking: SleepTracking) {
    if (!startTime || !endTime) return;

    setSaving(true);
    try {
      const { startedAt, endedAt } = buildTimestamps(sleepDate, startTime, endTime);
      const duration = calcDurationMinutes(startedAt, endedAt);
      await addSleepRecord(supabaseRef.current, {
        child_id: tracking.child_id,
        sleep_date: sleepDate,
        started_at: startedAt,
        ended_at: endedAt,
        duration_minutes: duration,
        sleep_category: classifySleep(startedAt),
      });
      await stopTracking(supabaseRef.current, tracking.id);

      const child = childrenList.find((c) => c.id === tracking.child_id);
      toast.success(`${child?.name ?? ""}の睡眠を記録しました`);

      // リセット
      setConfirmingTrackingId(null);
      setStartTime("");
      setEndTime("");
      onTrackingChange();
    } catch {
      toast.error("記録に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  // 手入力で保存（タイマー不使用時）
  async function handleManualRecord(childId: string) {
    if (!startTime || !endTime) {
      toast.error("就寝・起床時刻を入力してください");
      return;
    }

    setSaving(true);
    try {
      const { startedAt, endedAt } = buildTimestamps(sleepDate, startTime, endTime);
      const duration = calcDurationMinutes(startedAt, endedAt);
      await addSleepRecord(supabaseRef.current, {
        child_id: childId,
        sleep_date: sleepDate,
        started_at: startedAt,
        ended_at: endedAt,
        duration_minutes: duration,
        sleep_category: classifySleep(startedAt),
      });
      const child = childrenList.find((c) => c.id === childId);
      toast.success(`${child?.name ?? ""}の睡眠を記録しました`);
      setStartTime("");
      setEndTime("");
    } catch {
      toast.error("記録に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <span>😴 睡眠を記録</span>
          {hasAnyTracking && !open && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              記録中
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/40 px-4 py-3">
          {/* アクティブな計測を表示 */}
          {activeTracking.map((tracking) => {
            const trackingChild = childrenList.find((c) => c.id === tracking.child_id);
            const { date, time } = formatTrackingStartTime(tracking.started_at);
            const isConfirming = confirmingTrackingId === tracking.id;

            return (
              <div
                key={tracking.id}
                className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {trackingChild?.name} - 記録中
                    </p>
                    {editingTrackingId === tracking.id ? (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditedStartTime(tracking.id)}
                          disabled={saving || !editDate || !editTime}
                          className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTrackingId(null)}
                          className="rounded-md border border-border/60 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                        {date} {time}〜
                        <button
                          type="button"
                          onClick={() => {
                            setEditDate(date);
                            setEditTime(time);
                            setEditingTrackingId(tracking.id);
                          }}
                          className="inline-flex items-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                          title="開始時刻を修正"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.22 10.306a1 1 0 0 0-.26.445l-.812 3.22a.5.5 0 0 0 .607.607l3.22-.812a1 1 0 0 0 .445-.26l7.793-7.793a1.75 1.75 0 0 0 0-2.475l-.725-.725ZM11.72 3.22a.25.25 0 0 1 .354 0l.725.725a.25.25 0 0 1 0 .354L12 5.1 10.9 4l.82-.78ZM10.193 4.707l1.1 1.1-5.986 5.986-1.535.388.388-1.535 5.986-5.986.047.047Z" />
                          </svg>
                        </button>
                      </p>
                    )}
                  </div>
                  {!isConfirming && editingTrackingId !== tracking.id && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleWakeUp(tracking)}
                        disabled={saving}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        終了
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelTracking(tracking.id)}
                        disabled={saving}
                        className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 disabled:opacity-50"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>

                {/* 確認・修正画面 */}
                {isConfirming && (
                  <div className="space-y-3 border-t border-primary/20 pt-3">
                    <p className="text-xs font-medium tracking-wider text-muted-foreground">
                      時刻を確認・修正
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">日付</p>
                      <input
                        type="date"
                        value={sleepDate}
                        onChange={(e) => setSleepDate(e.target.value)}
                        className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">就寝時刻</p>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">起床時刻</p>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    {startTime && endTime && (
                      <p className="text-xs font-medium text-foreground">
                        ⏱ {calcPreview(startTime, endTime)}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRecord(tracking)}
                        disabled={saving}
                        className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {saving ? "保存中..." : "記録する"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingTrackingId(null);
                          setEndTime("");
                        }}
                        className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60"
                      >
                        戻る
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* タイマー未使用時: 開始ボタン + 手入力 */}
          {!currentTracking && (
            <>
              {/* 子供セレクタ（2人以上の場合） */}
              {showSelector && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium tracking-wider text-muted-foreground">
                    だれの記録？
                  </p>
                  <ChildSelector
                    childrenList={childrenList}
                    selectedId={selectedChildId}
                    onChange={setSelectedChildId}
                  />
                </div>
              )}

              {/* 開始ボタン */}
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wider text-muted-foreground">
                  タイマーで記録
                </p>
                <button
                  type="button"
                  onClick={() => handleSleepStart(selectedChildId)}
                  disabled={saving}
                  className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  開始
                </button>
              </div>

              {/* 手入力 */}
              <div className="space-y-3 border-t border-border/30 pt-3">
                <p className="text-xs font-medium tracking-wider text-muted-foreground">
                  手入力で記録
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">日付</p>
                  <input
                    type="date"
                    value={sleepDate}
                    onChange={(e) => setSleepDate(e.target.value)}
                    className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">就寝時刻</p>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">起床時刻</p>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                {startTime && endTime && (
                  <p className="text-xs font-medium text-foreground">
                    ⏱ {calcPreview(startTime, endTime)}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleManualRecord(selectedChildId)}
                    disabled={saving || !startTime || !endTime}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "..." : "記録"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
