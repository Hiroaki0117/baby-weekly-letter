"use client";

import { useRouter } from "next/navigation";

type ReactionNoticeProps = {
  count: number;
};

export function ReactionNotice({ count }: ReactionNoticeProps) {
  const router = useRouter();

  if (count <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => {
        localStorage.setItem("lastReactionCheckedAt", new Date().toISOString());
        router.push("/logs");
      }}
      className="flex w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
    >
      <span className="text-lg leading-none">❤️</span>
      <span className="text-sm font-medium text-foreground">
        {count}件の新しいリアクション
      </span>
      <span className="ml-auto text-xs text-muted-foreground">→</span>
    </button>
  );
}
