-- 日次ログへのスタンプリアクション機能
CREATE TABLE log_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(log_id, user_id, emoji)
);

CREATE INDEX idx_log_reactions_log_id ON log_reactions(log_id);

ALTER TABLE log_reactions ENABLE ROW LEVEL SECURITY;

-- 同じ家族のメンバーのみリアクションを閲覧可
CREATE POLICY select_family_reactions ON log_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_reactions.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

-- 自分のリアクションのみ追加可（対象ログが自分の家族に属する場合）
CREATE POLICY insert_own_reaction ON log_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_reactions.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

-- 自分のリアクションのみ削除可
CREATE POLICY delete_own_reaction ON log_reactions
  FOR DELETE USING (user_id = auth.uid());
