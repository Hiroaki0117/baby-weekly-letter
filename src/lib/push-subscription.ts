import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function savePushSubscription(
  client: Client,
  subscription: PushSubscription,
  userId: string,
  familyId: string
): Promise<void> {
  const json = subscription.toJSON();
  const endpoint = json.endpoint!;
  const p256dh = json.keys!.p256dh;
  const auth = json.keys!.auth;

  await client.from("push_subscriptions").upsert(
    {
      user_id: userId,
      family_id: familyId,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function deletePushSubscription(
  client: Client,
  endpoint: string
): Promise<void> {
  await client
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
}

export async function getNotificationSettings(
  client: Client
): Promise<{ reminder_enabled: boolean; prompt_shown: boolean } | null> {
  const { data } = await client
    .from("notification_settings")
    .select("reminder_enabled, prompt_shown")
    .single();

  return data;
}

export async function upsertNotificationSettings(
  client: Client,
  userId: string,
  settings: { reminder_enabled?: boolean; prompt_shown?: boolean }
): Promise<void> {
  await client.from("notification_settings").upsert(
    {
      user_id: userId,
      ...settings,
    },
    { onConflict: "user_id" }
  );
}
