"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [childName, setChildName] = useState("");
  const [childBirthDate, setChildBirthDate] = useState("");

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName,
          displayName,
          childName: childName || undefined,
          childBirthDate: childBirthDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "家族の作成に失敗しました");
        return;
      }

      toast.success("すくすく日記へようこそ！");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl shadow-foreground/5">
      <div className="border-b border-border/50 bg-secondary/40 px-8 py-7 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary/50 bg-primary/8">
          <span className="font-mincho text-xl font-bold text-primary">日</span>
        </div>
        <h1 className="font-mincho text-xl font-semibold tracking-wide text-foreground">
          すくすく日記
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          はじめに家族の情報を設定しましょう
        </p>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-2 px-8 pt-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="p-8">
        {/* ステップ 1: 家族名 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="font-mincho text-lg font-semibold">家族名</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                あなたの家族の名前を決めてください
              </p>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="familyName"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                家族名
              </Label>
              <Input
                id="familyName"
                placeholder="例: 田中家"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="border-border/70 bg-background/60 focus:border-primary/60"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!familyName.trim()}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              次へ
            </button>
          </div>
        )}

        {/* ステップ 2: 表示名 */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="font-mincho text-lg font-semibold">あなたの表示名</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                ログに表示される名前です
              </p>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="displayName"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                表示名
              </Label>
              <Input
                id="displayName"
                placeholder="例: パパ、ママ"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="border-border/70 bg-background/60 focus:border-primary/60"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-border/70 py-2.5 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!displayName.trim()}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* ステップ 3: お子さま情報 */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="font-mincho text-lg font-semibold">お子さまの情報</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                通信に名前と月齢が反映されます（任意）
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="childName"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  お名前
                </Label>
                <Input
                  id="childName"
                  placeholder="例: さくた"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="border-border/70 bg-background/60 focus:border-primary/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="childBirthDate"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  生年月日
                </Label>
                <Input
                  id="childBirthDate"
                  type="date"
                  value={childBirthDate}
                  onChange={(e) => setChildBirthDate(e.target.value)}
                  className="border-border/70 bg-background/60 focus:border-primary/60"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-border/70 py-2.5 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
              >
                戻る
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "作成中..." : "はじめる"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
