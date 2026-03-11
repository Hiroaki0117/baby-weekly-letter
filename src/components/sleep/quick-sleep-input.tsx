"use client";

import { useState, useEffect, useRef } from "react";
import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { addSleepRecord, buildTimestamps, calcDurationMinutes } from "@/lib/sleep";
import { toast } from "sonner";
import { ChildSelector } from "@/components/child/child-selector";
import type { Child } from "@/types";

type Props = {
  childrenList: Child[];
};

type TrackingState = {
  childId: string;
  startTime: string; // HH:mm
  startDate: string; // yyyy-MM-dd
};

function getStoredTracking(): TrackingState | null {
  try {
    const raw = localStorage.getItem("sleep_tracking");
    if (!raw) return null;
    return JSON.parse(raw) as TrackingState;
  } catch {
    return null;
  }
}

function setStoredTracking(state: TrackingState | null) {
  if (state) {
    localStorage.setItem("sleep_tracking", JSON.stringify(state));
  } else {
    localStorage.removeItem("sleep_tracking");
  }
}

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

export function QuickSleepInput({ childrenList }: Props) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState<TrackingState | null>(null);
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id ?? "");
  const [sleepDate, setSleepDate] = useState(getDefaultDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const supabaseRef = useRef(createClient());

  // localStorage から記録中の状態を復元
  useEffect(() => {
    const stored = getStoredTracking();
    if (stored) {
      setTracking(stored);
    }
  }, []);

  if (childrenList.length === 0) return null;

  const showSelector = childrenList.length >= 2;

  // 「寝た」ボタン
  function handleSleepStart(childId: string) {
    const state: TrackingState = {
      childId,
      startTime: nowTime(),
      startDate: format(new Date(), "yyyy-MM-dd"),
    };
    setTracking(state);
    setStoredTracking(state);
    const child = childrenList.find((c) => c.id === childId);
    toast.success(`${child?.name ?? ""}の就寝を記録しました（${state.startTime}）`);
  }

  // 「起きた」ボタン → 確認画面へ
  function handleWakeUp() {
    if (!tracking) return;
    setSleepDate(tracking.startDate);
    setStartTime(tracking.startTime);
    setEndTime(nowTime());
  }

  // 記録中をキャンセル
  function handleCancelTracking() {
    setTracking(null);
    setStoredTracking(null);
  }

  // 確認画面から保存
  async function handleRecord() {
    if (!tracking || !startTime || !endTime) return;

    setSaving(true);
    try {
      const { startedAt, endedAt } = buildTimestamps(sleepDate, startTime, endTime);
      const duration = calcDurationMinutes(startedAt, endedAt);
      await addSleepRecord(supabaseRef.current, {
        child_id: tracking.childId,
        sleep_date: sleepDate,
        started_at: startedAt,
        ended_at: endedAt,
        duration_minutes: duration,
      });
      const child = childrenList.find((c) => c.id === tracking.childId);
      toast.success(`${child?.name ?? ""}の睡眠を記録しました`);

      // リセット
      setTracking(null);
      setStoredTracking(null);
      setStartTime("");
      setEndTime("");
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

  const isConfirming = tracking && endTime !== "";
  const trackingChild = tracking ? childrenList.find((c) => c.id === tracking.childId) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <span>😴 睡眠を記録</span>
          {tracking && !open && (
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
          {/* タイマー記録中 → 起きたボタン or 確認画面 */}
          {tracking && (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    {trackingChild?.name} - 就寝中
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {tracking.startDate} {tracking.startTime}〜
                  </p>
                </div>
                {!isConfirming && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleWakeUp}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      起きた
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelTracking}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              {/* 確認・修正画面 */}
              {isConfirming && (
                <div className="space-y-2 border-t border-primary/20 pt-3">
                  <p className="text-xs font-medium tracking-wider text-muted-foreground">
                    時刻を確認・修正
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={sleepDate}
                      onChange={(e) => setSleepDate(e.target.value)}
                      className="w-32 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-24 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-24 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    {startTime && endTime && (
                      <span className="text-xs font-medium text-foreground">
                        {calcPreview(startTime, endTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRecord}
                      disabled={saving}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "記録する"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndTime("")}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60"
                    >
                      戻る
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* タイマー未使用時: 寝たボタン + 手入力 */}
          {!tracking && (
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

              {/* 寝たボタン */}
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wider text-muted-foreground">
                  タイマーで記録
                </p>
                <button
                  type="button"
                  onClick={() => handleSleepStart(selectedChildId)}
                  className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {childrenList.find((c) => c.id === selectedChildId)?.name ?? ""} が寝た
                </button>
              </div>

              {/* 手入力 */}
              <div className="space-y-2 border-t border-border/30 pt-3">
                <p className="text-xs font-medium tracking-wider text-muted-foreground">
                  手入力で記録
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={sleepDate}
                    onChange={(e) => setSleepDate(e.target.value)}
                    className="w-32 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-24 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-24 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {startTime && endTime && (
                    <span className="text-xs font-medium text-foreground">
                      {calcPreview(startTime, endTime)}
                    </span>
                  )}
                </div>
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
