"use client";

import { useState } from "react";
import { toast } from "sonner";

export function InviteLink() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/family/invite", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "招待リンクの作成に失敗しました");
        return;
      }

      const url = `${window.location.origin}/invite/${data.token}`;
      setInviteUrl(url);
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("招待リンクをコピーしました");
  }

  if (inviteUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2">
          <p className="flex-1 truncate text-xs text-muted-foreground">
            {inviteUrl}
          </p>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            コピー
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          有効期限: 7日間
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreateInvite}
      disabled={loading}
      className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
    >
      {loading ? "作成中..." : "招待リンクを発行"}
    </button>
  );
}
