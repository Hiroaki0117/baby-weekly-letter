"use client";

import { useRouter } from "next/navigation";

type ReactionNoticeProps = {
  reactionCount: number;
  commentCount: number;
};

export function ReactionNotice({ reactionCount, commentCount }: ReactionNoticeProps) {
  const router = useRouter();
  const total = reactionCount + commentCount;

  if (total <= 0) return null;

  const parts: string[] = [];
  if (reactionCount > 0) parts.push(`${reactionCount}件のリアクション`);
  if (commentCount > 0) parts.push(`${commentCount}件のコメント`);
  const label = parts.join("・");

  return (
    <button
      type="button"
      onClick={() => {
        const now = new Date().toISOString();
        localStorage.setItem("lastReactionCheckedAt", now);
        localStorage.setItem("lastCommentCheckedAt", now);
        router.push("/logs");
      }}
      className="flex w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
    >
      <span className="text-lg leading-none">{commentCount > 0 && reactionCount === 0 ? "💬" : "❤️"}</span>
      <span className="text-sm font-medium text-foreground">
        新しい{label}
      </span>
      <span className="ml-auto text-xs text-muted-foreground">→</span>
    </button>
  );
}
