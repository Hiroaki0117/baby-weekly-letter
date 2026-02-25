"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [children, setChildren] = useState([{ name: "", birthDate: "" }]);

  // 既に家族所属済みならホームへリダイレクト
  // RLSを経由せずSECURITY DEFINERのmy_family_id()を直接呼ぶ
  useEffect(() => {
    async function checkFamily() {
      const { data: familyId } = await supabaseRef.current.rpc("my_family_id");
      if (familyId) {
        window.location.href = "/";
      } else {
        setChecking(false);
      }
    }
    checkFamily();
  }, []);

  async function handleComplete() {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName,
          displayName,
          children: children.map((c) => ({
            name: c.name || undefined,
            birthDate: c.birthDate || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        // 既に家族所属済みならホームへリダイレクト
        if (data.alreadyMember) {
          window.location.href = "/";
          return;
        }
        setErrorMessage(data.error ?? "家族の作成に失敗しました");
        return;
      }

      toast.success("すくすく日記へようこそ！");
      // フルリロードでミドルウェアのキャッシュ問題を回避
      window.location.href = "/";
    } catch {
      setErrorMessage("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl shadow-foreground/5">
      <div className="border-b border-primary/10 bg-gradient-to-b from-primary/8 to-primary/3 px-8 py-7 text-center">
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
        {errorMessage && (
          <Alert variant="destructive" className="mb-5" aria-live="polite">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
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
              {children.map((child, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-border/40 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {index + 1}人目
                    </p>
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setChildren((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="text-xs text-destructive/70 transition-colors hover:text-destructive"
                      >
                        削除
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      お名前
                    </Label>
                    <Input
                      placeholder="例: さくた"
                      value={child.name}
                      onChange={(e) =>
                        setChildren((prev) =>
                          prev.map((c, i) =>
                            i === index ? { ...c, name: e.target.value } : c
                          )
                        )
                      }
                      className="border-border/70 bg-background/60 focus:border-primary/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      生年月日
                    </Label>
                    <Input
                      type="date"
                      value={child.birthDate}
                      onChange={(e) =>
                        setChildren((prev) =>
                          prev.map((c, i) =>
                            i === index
                              ? { ...c, birthDate: e.target.value }
                              : c
                          )
                        )
                      }
                      className="border-border/70 bg-background/60 focus:border-primary/60"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setChildren((prev) => [
                    ...prev,
                    { name: "", birthDate: "" },
                  ])
                }
                className="flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 text-xs">
                  +
                </span>
                もう1人追加
              </button>
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
                {loading ? "作成中…" : "はじめる"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
