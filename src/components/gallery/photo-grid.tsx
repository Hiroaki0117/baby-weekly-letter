"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MonthGroup } from "@/lib/gallery";

type PhotoGridProps = {
  months: MonthGroup[];
  childrenMap: Map<string, string>;
  showChildBadge: boolean;
  onSelect: (photo: {
    imageUrl: string;
    logDate: string;
    text: string;
    mood: string;
    childName?: string;
  }) => void;
};

async function fetchSignedUrls(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage
        .from("log-photos")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        urls[path] = data.signedUrl;
      }
    })
  );
  return urls;
}

export function PhotoGrid({
  months,
  childrenMap,
  showChildBadge,
  onSelect,
}: PhotoGridProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const supabaseRef = useRef(createClient());
  const loadedMonthsRef = useRef(new Set<string>());

  // 初回は直近2ヶ月分をロード
  useEffect(() => {
    const initialMonths = months.slice(0, 2);
    const paths: string[] = [];

    for (const group of initialMonths) {
      if (loadedMonthsRef.current.has(group.key)) continue;
      loadedMonthsRef.current.add(group.key);
      for (const photo of group.photos) {
        paths.push(photo.storagePath);
      }
    }

    if (paths.length === 0) return;

    let cancelled = false;
    fetchSignedUrls(supabaseRef.current, paths).then((urls) => {
      if (!cancelled) {
        setSignedUrls((prev) => ({ ...prev, ...urls }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [months]);

  const handleMonthVisible = useCallback(
    (monthKey: string) => {
      if (loadedMonthsRef.current.has(monthKey)) return;
      const group = months.find((m) => m.key === monthKey);
      if (!group) return;

      loadedMonthsRef.current.add(monthKey);
      const paths = group.photos.map((p) => p.storagePath);

      fetchSignedUrls(supabaseRef.current, paths).then((urls) => {
        setSignedUrls((prev) => ({ ...prev, ...urls }));
      });
    },
    [months]
  );

  return (
    <div className="space-y-8">
      {months.map((group) => (
        <MonthSection
          key={group.key}
          group={group}
          signedUrls={signedUrls}
          childrenMap={childrenMap}
          showChildBadge={showChildBadge}
          onSelect={onSelect}
          onVisible={() => handleMonthVisible(group.key)}
        />
      ))}
    </div>
  );
}

function MonthSection({
  group,
  signedUrls,
  childrenMap,
  showChildBadge,
  onSelect,
  onVisible,
}: {
  group: MonthGroup;
  signedUrls: Record<string, string>;
  childrenMap: Map<string, string>;
  showChildBadge: boolean;
  onSelect: PhotoGridProps["onSelect"];
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <section ref={ref}>
      {/* 月ヘッダー */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          {group.label}
          {" ・ "}
          {group.photos.length}枚
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* グリッド */}
      <div className="grid grid-cols-3 gap-1">
        {group.photos.map((photo) => {
          const url = signedUrls[photo.storagePath];
          const childName = childrenMap.get(photo.childId);

          return (
            <button
              key={photo.logId}
              onClick={() => {
                if (url) {
                  onSelect({
                    imageUrl: url,
                    logDate: photo.logDate,
                    text: photo.text,
                    mood: photo.mood,
                    childName: showChildBadge ? childName : undefined,
                  });
                }
              }}
              className="relative aspect-square overflow-hidden rounded-md bg-muted/50 transition-opacity hover:opacity-90"
            >
              {url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={url}
                  alt={`${photo.logDate}の写真`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60 animate-spin" />
                </div>
              )}

              {/* 子供バッジ */}
              {showChildBadge && childName && (
                <span className="absolute bottom-1 left-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  {childName}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
