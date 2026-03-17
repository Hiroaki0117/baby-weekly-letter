"use client";

import { MOOD_OPTIONS } from "@/types";
import type { DailyLog } from "@/types";
import { ChildBadge } from "@/components/child/child-badge";

type MemoryCardProps = {
  log: DailyLog;
  photoUrl?: string | null;
  childName?: string;
};

export function MemoryCard({ log, photoUrl, childName }: MemoryCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      {/* 写真（ある場合） */}
      {photoUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={`${log.log_date}の写真`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* ログ情報 */}
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">
            {MOOD_OPTIONS.find((o) => o.value === log.mood)?.emoji ?? ""}
          </span>
          {childName && <ChildBadge name={childName} />}
        </div>
        <p className="text-sm leading-relaxed text-foreground line-clamp-3">
          {log.text}
        </p>
        {log.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {log.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
