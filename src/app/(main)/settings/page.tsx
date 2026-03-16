"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/schemas/profile";
import {
  getNotificationSettings,
  upsertNotificationSettings,
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/push-subscription";
import { getMyFamilyId } from "@/lib/supabase/family";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/vapid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [togglingReminder, setTogglingReminder] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { display_name: "" },
  });

  useEffect(() => {
    const client = supabaseRef.current;

    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC_KEY;
    setPushSupported(supported);

    async function load() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;

      const { data: profile } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        profileForm.reset({
          display_name:
            (profile as { display_name: string | null }).display_name ?? "",
        });
      }

      if (supported) {
        const settings = await getNotificationSettings(client);
        setReminderEnabled(settings?.reminder_enabled ?? false);
      }

      setLoading(false);
    }
    load();
  }, [profileForm]);

  async function onSubmitProfile(values: ProfileFormValues) {
    setSavingProfile(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("認証エラー");

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          display_name: values.display_name || null,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      // family_members の display_name も更新
      await supabase
        .from("family_members")
        .update({ display_name: values.display_name || null })
        .eq("user_id", user.id);

      toast.success("プロフィールを保存しました");
    } catch (error) {
      toast.error("保存に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleToggleReminder() {
    setTogglingReminder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newEnabled = !reminderEnabled;

      if (newEnabled) {
        // ONにする場合: 通知許可 → Subscription保存
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("ブラウザの通知が許可されていません");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const familyId = await getMyFamilyId(supabase);
        if (!familyId) return;

        await savePushSubscription(supabase, subscription, user.id, familyId);
      } else {
        // OFFにする場合: Subscription削除
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await deletePushSubscription(supabase, subscription.endpoint);
          await subscription.unsubscribe();
        }
      }

      await upsertNotificationSettings(supabase, user.id, {
        reminder_enabled: newEnabled,
        prompt_shown: true,
      });

      setReminderEnabled(newEnabled);
      toast.success(newEnabled ? "リマインダーをONにしました" : "リマインダーをOFFにしました");
    } catch {
      toast.error("設定の変更に失敗しました");
    } finally {
      setTogglingReminder(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ページヘッダー */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Settings
        </p>
        <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
          設定
        </h1>
      </div>

      <div className="h-px bg-border/60" />

      {/* あなたの情報 */}
      <form
        onSubmit={profileForm.handleSubmit(onSubmitProfile)}
        className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
      >
        <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            あなたの情報
          </p>
        </div>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <Label
              htmlFor="display_name"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              表示名
            </Label>
            <Input
              id="display_name"
              placeholder="例: パパ、ママ"
              {...profileForm.register("display_name")}
              className="border-border/60 bg-background/60 focus:border-primary/50"
            />
            <p className="text-[11px] text-muted-foreground">
              ログに表示される名前です
            </p>
          </div>
        </div>
        <div className="border-t border-border/40 bg-muted/20 px-5 py-3">
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
          >
            {savingProfile ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>

      {/* 通知設定 */}
      {pushSupported && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/40 bg-muted/30 px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              通知
            </p>
          </div>
          <div className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">日記リマインダー</p>
              <p className="text-[11px] text-muted-foreground">
                日記がない日の21時に通知します
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleReminder}
              disabled={togglingReminder}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${
                reminderEnabled ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={reminderEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                  reminderEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ログアウト（モバイルのみ） */}
      <div className="md:hidden">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-border/60 bg-card px-5 py-3.5 text-left text-sm text-destructive shadow-sm transition-colors hover:bg-destructive/5"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
