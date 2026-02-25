"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCandidateDates, groupMemoriesByYear, type YearGroup } from "@/lib/memories";
import { MemoryCard } from "./memory-card";
import type { Child, DailyLog } from "@/types";

type MemoriesSectionProps = {
  childrenList: Child[];
};

const INITIAL_DISPLAY_COUNT = 2;

export function MemoriesSection({ childrenList }: MemoriesSectionProps) {
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const client = supabaseRef.current;
    const today = new Date();
    const candidateDates = getCandidateDates(today);

    async function load() {
      if (candidateDates.length === 0) {
        setLoaded(true);
        return;
      }

      const { data, error } = await client
        .from("daily_logs")
        .select("*")
        .in("log_date", candidateDates)
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        setLoaded(true);
        return;
      }

      const logs = data as DailyLog[];
      const groups = groupMemoriesByYear(logs, today);
      setYearGroups(groups);

      // 写真付きログの signed URL を取得
      const photoPaths = logs
        .filter((l) => l.photo_storage_path)
        .map((l) => ({ id: l.id, path: l.photo_storage_path! }));

      if (photoPaths.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(
          photoPaths.map(async ({ id, path }) => {
            const { data } = await client.storage
              .from("log-photos")
              .createSignedUrl(path, 3600);
            if (data?.signedUrl) {
              urls[id] = data.signedUrl;
            }
          })
        );
        setPhotoUrls(urls);
      }

      setLoaded(true);
    }

    load();
  }, []);

  // データがない、またはまだ読み込み中は非表示
  if (!loaded || yearGroups.length === 0) return null;

  const showChildBadge = childrenList.length >= 2;
  const childrenMap = new Map(childrenList.map((c) => [c.id, c.name ?? ""]));

  function handleExpand(yearsAgo: number) {
    setExpandedYears((prev) => new Set(prev).add(yearsAgo));
  }

  return (
    <div className="space-y-4">
      {/* セクションタイトル */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-primary/70">
          🕰 過去の振り返り
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {yearGroups.map((group) => {
        const isExpanded = expandedYears.has(group.yearsAgo);
        const visibleLogs = isExpanded
          ? group.logs
          : group.logs.slice(0, INITIAL_DISPLAY_COUNT);
        const hiddenCount = group.logs.length - INITIAL_DISPLAY_COUNT;

        return (
          <div key={group.yearsAgo} className="space-y-3">
            {/* 年ヘッダー */}
            <div className="relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-r from-primary/8 to-transparent px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🕰</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {group.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {group.dateLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* カード一覧 */}
            {visibleLogs.map((log) => (
              <MemoryCard
                key={log.id}
                log={log}
                photoUrl={photoUrls[log.id]}
                childName={
                  showChildBadge ? childrenMap.get(log.child_id) : undefined
                }
              />
            ))}

            {/* もっと見るボタン */}
            {!isExpanded && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => handleExpand(group.yearsAgo)}
                className="w-full rounded-lg border border-border/50 bg-card/50 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                もっと見る（残り{hiddenCount}件）
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
