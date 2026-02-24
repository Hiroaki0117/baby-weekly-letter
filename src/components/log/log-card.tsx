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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    <>
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
                <div className="flex items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(log)}
                    className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="rounded px-2 py-1 text-xs text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    削除
                  </button>
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

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="w-full max-w-xs overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-destructive"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">
                このきろくを削除しますか？
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                この操作は取り消せません
              </p>
            </div>
            <div className="flex border-t border-border/40">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                キャンセル
              </button>
              <div className="w-px bg-border/40" />
              <button
                onClick={() => {
                  onDelete(log.id);
                  setShowDeleteDialog(false);
                }}
                className="flex-1 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
