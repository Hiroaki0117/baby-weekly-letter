"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      // ログイン状態確認
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      // トークン検証
      const { data, error: rpcError } = await supabase.rpc(
        "verify_invitation",
        { invite_token: token }
      );

      if (rpcError || !data || data.length === 0) {
        setError("この招待リンクは無効または期限切れです");
      } else {
        setFamilyName(data[0].family_name);
      }

      setLoading(false);
    }
    check();
  }, [supabase, token]);

  async function handleJoin() {
    setJoining(true);
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          displayName: displayName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "参加に失敗しました");
        return;
      }

      toast.success(`${familyName}に参加しました！`);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="mt-3 text-xs text-muted-foreground">確認中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card p-8 text-center shadow-xl">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
          >
            ログインページへ
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
          <div className="border-b border-border/50 bg-secondary/40 px-8 py-7 text-center">
            <h1 className="font-mincho text-xl font-semibold">すくすく日記</h1>
            <p className="mt-2 text-sm text-foreground">
              <span className="font-semibold">{familyName}</span>
              に招待されています
            </p>
          </div>
          <div className="space-y-4 p-8">
            <p className="text-center text-xs text-muted-foreground">
              参加するにはログインまたはアカウント登録が必要です
            </p>
            <button
              onClick={() => router.push(`/login?invite=${token}`)}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              ログイン
            </button>
            <button
              onClick={() => router.push(`/signup?invite=${token}`)}
              className="w-full rounded-lg border border-border/70 py-2.5 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
            >
              新規登録
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
        <div className="border-b border-border/50 bg-secondary/40 px-8 py-7 text-center">
          <h1 className="font-mincho text-xl font-semibold">すくすく日記</h1>
          <p className="mt-2 text-sm text-foreground">
            <span className="font-semibold">{familyName}</span>
            に参加しますか？
          </p>
        </div>
        <div className="space-y-5 p-8">
          <div className="space-y-1.5">
            <Label
              htmlFor="displayName"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              あなたの表示名
            </Label>
            <Input
              id="displayName"
              placeholder="例: パパ、ママ"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-border/70 bg-background/60 focus:border-primary/60"
            />
            <p className="text-[11px] text-muted-foreground">
              ログに表示される名前です（任意）
            </p>
          </div>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {joining ? "参加中..." : "参加する"}
          </button>
        </div>
      </div>
    </div>
  );
}
