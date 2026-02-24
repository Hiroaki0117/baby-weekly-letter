"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDateJa } from "@/lib/date";
import { MOOD_OPTIONS, CATEGORY_OPTIONS, type DailyLog } from "@/types";
import { AuthorBadge } from "./author-badge";
import { createClient } from "@/lib/supabase/client";

type LogCardProps = {
  log: DailyLog;
  authorDisplayName?: string | null;
  onEdit: (log: DailyLog) => void;
  onDelete: (id: string) => void;
};

export function LogCard({ log, authorDisplayName, onEdit, onDelete }: LogCardProps) {
  const [confirming, setConfirming] = useState(false);
  const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
  const supabase = createClient();

  let photoUrl: string | null = null;
  if (log.photo_storage_path) {
    const { data } = supabase.storage
      .from("log-photos")
      .getPublicUrl(log.photo_storage_path);
    photoUrl = data.publicUrl;
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm shadow-primary/5 transition-all duration-200 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-1">
      <div className="flex">
        {/* 左アクセントストリップ（付箋テープ風） */}
        <div className="w-1 flex-shrink-0 bg-gradient-to-b from-primary via-primary/70 to-primary/30" />

        <div className="flex-1 min-w-0">
          {/* 写真 */}
          {photoUrl && (
            <div className="relative h-44 w-full overflow-hidden">
              <Image
                src={photoUrl}
                alt="ログ写真"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          )}

          <div className="space-y-2.5 p-4">
            {/* ヘッダー */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{moodOption?.emoji}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">
                      {formatDateJa(log.log_date)}
                    </p>
                    <AuthorBadge displayName={authorDisplayName ?? null} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {moodOption?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {confirming ? (
                  <>
                    <span className="text-xs text-destructive mr-1">本当に削除しますか？</span>
                    <button
                      onClick={() => { onDelete(log.id); setConfirming(false); }}
                      className="rounded px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      削除する
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onEdit(log)}
                      className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setConfirming(true)}
                      className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 本文 */}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {log.text}
            </p>

            {/* カテゴリ */}
            {log.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {log.categories.map((cat) => {
                  const label =
                    CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat;
                  return (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="border border-primary/20 bg-primary/8 text-[10px] text-primary/80"
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
