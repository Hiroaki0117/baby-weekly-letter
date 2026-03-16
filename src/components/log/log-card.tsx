"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { AccentCard } from "@/components/ui/accent-card";
import { formatDateJa } from "@/lib/date";
import { MOOD_OPTIONS, CATEGORY_OPTIONS, type DailyLog } from "@/types";
import type { ReactionSummary } from "@/lib/reactions";
import type { CommentEntry } from "@/lib/comments";
import type { Milestone } from "@/types";
import { AuthorBadge } from "./author-badge";
import { ReactionBar } from "./reaction-bar";
import { CommentSection } from "./comment-section";
import { ChildBadge } from "@/components/child/child-badge";
import { createClient } from "@/lib/supabase/client";

type LogCardProps = {
  log: DailyLog;
  childName?: string | null;
  authorDisplayName?: string | null;
  milestone?: Milestone | null;
  reactions?: ReactionSummary[];
  comments?: CommentEntry[];
  currentUserId?: string;
  nameMap?: Record<string, string>;
  onEdit: (log: DailyLog) => void;
  onDelete: (id: string) => void;
  onToggleReaction?: (logId: string, emoji: string) => void;
  onAddComment?: (logId: string, text: string) => void;
  onUpdateComment?: (commentId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
};

export function LogCard({ log, childName, authorDisplayName, milestone, reactions, comments, currentUserId, nameMap, onEdit, onDelete, onToggleReaction, onAddComment, onUpdateComment, onDeleteComment }: LogCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
  const supabase = createClient();

  useEffect(() => {
    if (!log.photo_storage_path) return;
    let cancelled = false;
    supabase.storage
      .from("log-photos")
      .createSignedUrl(log.photo_storage_path, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) {
          setPhotoUrl(data.signedUrl);
        }
      });
    return () => { cancelled = true; };
  }, [log.photo_storage_path]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AccentCard accent={milestone ? "amber" : "primary"}>
        {/* 写真サムネイル */}
        {photoUrl && (
          <button
            type="button"
            onClick={() => setShowLightbox(true)}
            className="relative h-44 w-full overflow-hidden cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="ログ写真"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
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
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </p>
                  {childName && <ChildBadge name={childName} />}
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

          {/* マイルストーンバッジ */}
          {milestone && (
            <div>
              <Badge className="border border-amber-300/50 bg-amber-50 text-[10px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-400">
                ✨ {milestone.title}
              </Badge>
            </div>
          )}

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

          {/* リアクション */}
          {onToggleReaction && (
            <ReactionBar
              logId={log.id}
              reactions={reactions ?? []}
              nameMap={nameMap ?? {}}
              onToggle={onToggleReaction}
            />
          )}

          {/* コメント */}
          {onAddComment && onUpdateComment && onDeleteComment && currentUserId && (
            <CommentSection
              logId={log.id}
              comments={comments ?? []}
              currentUserId={currentUserId}
              nameMap={nameMap ?? {}}
              onAdd={onAddComment}
              onUpdate={onUpdateComment}
              onDelete={onDeleteComment}
            />
          )}
        </div>
      </AccentCard>

      {/* 写真ライトボックス */}
      {showLightbox && photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/80 transition-colors hover:bg-black/70 hover:text-white"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="ログ写真"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
                この日記を削除しますか？
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
