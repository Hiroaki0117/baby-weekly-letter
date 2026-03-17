import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { REACTION_STAMPS } from "@/types";
export { REACTION_STAMPS };

export type ReactionSummary = {
  emoji: string;
  count: number;
  reacted: boolean;
  userIds: string[];
};

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
        userIds: matching.map((r) => r.user_id),
      };
    });
  }

  return result;
}

/**
 * ログIDに対するデフォルトの空 ReactionSummary[] を生成する。
 */
export function emptyReactionSummaries(): ReactionSummary[] {
  return REACTION_STAMPS.map((stamp) => ({
    emoji: stamp.key,
    count: 0,
    reacted: false,
    userIds: [],
  }));
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
