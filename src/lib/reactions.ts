import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type ReactionSummary = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export const REACTION_STAMPS = [
  { key: "heart", emoji: "❤️", label: "いいね" },
  { key: "clap", emoji: "👏", label: "すごい！" },
  { key: "smile", emoji: "😊", label: "ほっこり" },
  { key: "muscle", emoji: "💪", label: "おつかれさま" },
  { key: "sparkle", emoji: "✨", label: "キラキラ" },
] as const;

type RawReaction = {
  log_id: string;
  user_id: string;
  emoji: string;
};

/**
 * 生のリアクションデータを、ログID別の ReactionSummary[] に変換する。
 * 各ログに対して REACTION_STAMPS の全スタンプ分のエントリを返す。
 */
export function buildReactionMap(
  rawReactions: RawReaction[],
  currentUserId: string
): Record<string, ReactionSummary[]> {
  // ログIDごとにグルーピング
  const grouped: Record<string, RawReaction[]> = {};
  for (const r of rawReactions) {
    if (!grouped[r.log_id]) grouped[r.log_id] = [];
    grouped[r.log_id].push(r);
  }

  const result: Record<string, ReactionSummary[]> = {};

  for (const [logId, reactions] of Object.entries(grouped)) {
    result[logId] = REACTION_STAMPS.map((stamp) => {
      const matching = reactions.filter((r) => r.emoji === stamp.key);
      return {
        emoji: stamp.key,
        count: matching.length,
        reacted: matching.some((r) => r.user_id === currentUserId),
      };
    });
  }

  return result;
}

/**
 * リアクションをトグル（INSERT or DELETE）する。
 */
export async function toggleReaction(
  supabase: SupabaseClient<Database>,
  logId: string,
  userId: string,
  emoji: string,
  currentlyReacted: boolean
): Promise<void> {
  if (currentlyReacted) {
    await supabase
      .from("log_reactions")
      .delete()
      .eq("log_id", logId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
  } else {
    await supabase
      .from("log_reactions")
      .insert({ log_id: logId, user_id: userId, emoji });
  }
}
