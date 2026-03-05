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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CommentItem({ comment, authorName, isOwn, onUpdate, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

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
      <span className="shrink-0 text-[10px] text-muted-foreground/60">
        {formatTime(comment.createdAt)}
      </span>
      {isOwn && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover/comment:opacity-100 hover:bg-muted hover:text-muted-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-5 z-10 min-w-[80px] rounded-lg border border-border/60 bg-card py-1 shadow-lg">
              <button
                type="button"
                onClick={() => { setShowMenu(false); setEditing(true); }}
                className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => { setShowMenu(false); onDelete(comment.id); }}
                className="block w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/5"
              >
                削除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
