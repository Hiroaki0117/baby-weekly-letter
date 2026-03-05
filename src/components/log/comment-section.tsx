"use client";

import { useState } from "react";
import type { CommentEntry } from "@/lib/comments";
import { CommentItem } from "./comment-item";

type CommentSectionProps = {
  logId: string;
  comments: CommentEntry[];
  currentUserId: string;
  nameMap: Record<string, string>;
  onAdd: (logId: string, text: string) => void;
  onUpdate: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
};

export function CommentSection({
  logId,
  comments,
  currentUserId,
  nameMap,
  onAdd,
  onUpdate,
  onDelete,
}: CommentSectionProps) {
  const [text, setText] = useState("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(logId, trimmed);
    setText("");
  }

  return (
    <div className="space-y-2">
      {/* コメント一覧 */}
      {comments.length > 0 && (
        <div className="space-y-1.5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              authorName={nameMap[comment.userId] ?? "不明"}
              isOwn={comment.userId === currentUserId}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* 入力欄 */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="コメントを入力..."
          maxLength={100}
          className="flex-1 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="rounded-md bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          送信
        </button>
      </div>
    </div>
  );
}
