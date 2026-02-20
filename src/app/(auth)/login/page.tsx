"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("ログインに失敗しました", { description: error.message });
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      toast.error("Googleログインに失敗しました", {
        description: error.message,
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl shadow-foreground/5">
      {/* カード上部: 印鑑風ヘッダー */}
      <div className="border-b border-border/50 bg-secondary/40 px-8 py-7 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary/50 bg-primary/8">
          <span className="font-mincho text-xl font-bold text-primary">日</span>
        </div>
        <h1 className="font-mincho text-xl font-semibold tracking-wide text-foreground">
          すくすく日記
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          ログインしてはじめましょう
        </p>
      </div>

      <div className="p-8">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              メールアドレス
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="mail@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-border/70 bg-background/60 focus:border-primary/60"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              パスワード
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-border/70 bg-background/60 focus:border-primary/60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-muted-foreground">
              または
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border/70 bg-background/60 py-2.5 text-sm text-foreground transition-all hover:border-border hover:bg-secondary/60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Googleでログイン
        </button>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/signup"
            className="text-primary underline-offset-2 hover:underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
