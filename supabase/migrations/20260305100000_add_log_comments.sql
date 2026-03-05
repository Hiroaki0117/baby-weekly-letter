-- 日次ログへの短文コメント機能
CREATE TABLE log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT log_comments_text_length CHECK (char_length(text) <= 100),
  CONSTRAINT log_comments_text_not_empty CHECK (char_length(trim(text)) > 0)
);

CREATE INDEX idx_log_comments_log_id ON log_comments(log_id);

ALTER TABLE log_comments ENABLE ROW LEVEL SECURITY;

-- 同じ家族のメンバーのみコメントを閲覧可
CREATE POLICY select_family_comments ON log_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_comments.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

-- 自分のコメントのみ追加可（対象ログが自分の家族に属する場合）
CREATE POLICY insert_own_comment ON log_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = log_comments.log_id
        AND daily_logs.family_id = my_family_id()
    )
  );

-- 自分のコメントのみ編集可
CREATE POLICY update_own_comment ON log_comments
  FOR UPDATE USING (user_id = auth.uid());

-- 自分のコメントのみ削除可
CREATE POLICY delete_own_comment ON log_comments
  FOR DELETE USING (user_id = auth.uid());

-- updated_at トリガー
CREATE TRIGGER log_comments_updated_at
  BEFORE UPDATE ON log_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
