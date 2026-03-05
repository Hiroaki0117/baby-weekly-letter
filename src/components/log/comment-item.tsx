"use client";

import { useState, useRef, useEffect } from "react";
import type { CommentEntry } from "@/lib/comments";

type CommentItemProps = {
  comment: CommentEntry;
  authorName: string;
  isOwn: boolean;
  onUpdate: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CommentItem({ comment, authorName, isOwn, onUpdate, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function handleSave() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== comment.text) {
      onUpdate(comment.id, trimmed);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setEditing(false); setEditText(comment.text); }
          }}
          maxLength={100}
          className="flex-1 rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleSave}
          className="rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          保存
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setEditText(comment.text); }}
          className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <div className="group/comment flex items-start gap-1.5 text-xs">
      <span className="font-medium text-foreground/70">{authorName}:</span>
      <span className="flex-1 text-foreground/85">{comment.text}</span>
      <span className="shrink-0 text-[10px] text-foreground/85">
        {formatDateTime(comment.createdAt)}
      </span>
      {isOwn && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-[10px] text-foreground/85 hover:underline"
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="shrink-0 text-[10px] text-foreground/85 hover:underline"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
