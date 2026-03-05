import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LogComment } from "@/types";

export type CommentEntry = {
  id: string;
  logId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

type RawComment = {
  id: string;
  log_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
};

/**
 * 生のコメントデータを、ログID別の CommentEntry[] に変換する。
 * 各ログのコメントは created_at 昇順でソート済み。
 */
export function buildCommentMap(
  rawComments: RawComment[]
): Record<string, CommentEntry[]> {
  const grouped: Record<string, CommentEntry[]> = {};

  for (const c of rawComments) {
    const entry: CommentEntry = {
      id: c.id,
      logId: c.log_id,
      userId: c.user_id,
      text: c.text,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
    if (!grouped[c.log_id]) grouped[c.log_id] = [];
    grouped[c.log_id].push(entry);
  }

  // 昇順ソート（古い順）
  for (const entries of Object.values(grouped)) {
    entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return grouped;
}

/**
 * コメントを追加する。
 */
export async function addComment(
  supabase: SupabaseClient<Database>,
  logId: string,
  userId: string,
  text: string
): Promise<LogComment> {
  const { data, error } = await supabase
    .from("log_comments")
    .insert({ log_id: logId, user_id: userId, text })
    .select()
    .single();

  if (error) throw error;
  return data as LogComment;
}

/**
 * コメントを更新する。
 */
export async function updateComment(
  supabase: SupabaseClient<Database>,
  commentId: string,
  text: string
): Promise<void> {
  const { error } = await supabase
    .from("log_comments")
    .update({ text })
    .eq("id", commentId);

  if (error) throw error;
}

/**
 * コメントを削除する。
 */
export async function deleteComment(
  supabase: SupabaseClient<Database>,
  commentId: string
): Promise<void> {
  const { error } = await supabase
    .from("log_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}
