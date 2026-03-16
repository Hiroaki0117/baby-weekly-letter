"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getNotificationSettings, upsertNotificationSettings, savePushSubscription } from "@/lib/push-subscription";
import { getMyFamilyId } from "@/lib/supabase/family";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/vapid";

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!isPushSupported() || !VAPID_PUBLIC_KEY) return;

    const client = supabaseRef.current;

    async function checkPrompt() {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const settings = await getNotificationSettings(client);

      // prompt_shown が true なら表示しない（null = レコードなし = 未表示）
      if (settings?.prompt_shown) return;

      setShow(true);
    }

    checkPrompt();
  }, []);

  async function handleAllow() {
    const client = supabaseRef.current;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        // ブラウザで拒否された場合も prompt_shown を立てる
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          await upsertNotificationSettings(client, user.id, {
            prompt_shown: true,
            reminder_enabled: false,
          });
        }
        setShow(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const familyId = await getMyFamilyId(client);
      if (!familyId) return;

      await savePushSubscription(client, subscription, user.id, familyId);
      await upsertNotificationSettings(client, user.id, {
        prompt_shown: true,
        reminder_enabled: true,
      });
    } catch {
      // エラー時もダイアログを閉じる
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await upsertNotificationSettings(client, user.id, {
          prompt_shown: true,
          reminder_enabled: false,
        });
      }
    }

    setShow(false);
  }

  async function handleDismiss() {
    const client = supabaseRef.current;
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      await upsertNotificationSettings(client, user.id, {
        prompt_shown: true,
        reminder_enabled: false,
      });
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-foreground">
          日記リマインダー
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          その日の日記がまだないときに、21時にお知らせします。日記の習慣づけにお役立てください。
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            今はしない
          </button>
          <button
            onClick={handleAllow}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            通知を受け取る
          </button>
        </div>
      </div>
    </div>
  );
}
