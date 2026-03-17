"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NOTIFICATION_TYPE_ICONS } from "@/types";
import type { AppNotification } from "@/types";

type NotificationListProps = {
  notifications: AppNotification[];
  onRead: (id: string) => void;
};

export function NotificationList({
  notifications,
  onRead,
}: NotificationListProps) {
  const router = useRouter();
  const supabase = createClient();

  if (notifications.length === 0) return null;

  async function handleClick(notification: AppNotification) {
    // 既読にする
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notification.id);

    onRead(notification.id);
    router.push(notification.link);
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => handleClick(n)}
          className="flex w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
        >
          <span className="text-lg leading-none">
            {NOTIFICATION_TYPE_ICONS[n.type] ?? "🔔"}
          </span>
          <span className="text-sm font-medium text-foreground">
            {n.title}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">→</span>
        </button>
      ))}
    </div>
  );
}
