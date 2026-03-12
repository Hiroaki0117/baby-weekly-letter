-- 統合通知テーブル（アルバム自動生成・リアクション・コメント通知）
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  link text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notifications_type_check CHECK (
    type IN ('auto_weekly', 'auto_monthly', 'auto_annual', 'reaction', 'comment')
  )
);

-- 未読通知の高速検索用インデックス
CREATE INDEX idx_notifications_family_unread
  ON notifications(family_id, read) WHERE read = false;

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, read) WHERE read = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "家族の通知を参照できる（全員宛て or 自分宛て）"
  ON notifications FOR SELECT
  USING (
    family_id = my_family_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "自分の通知を既読にできる"
  ON notifications FOR UPDATE
  USING (
    family_id = my_family_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  )
  WITH CHECK (
    family_id = my_family_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- リアクション通知トリガー
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  log_author_id uuid;
  log_family_id uuid;
BEGIN
  SELECT author_id, family_id INTO log_author_id, log_family_id
  FROM daily_logs WHERE id = NEW.log_id;

  -- 自分自身のログへのリアクションは通知しない
  IF NEW.user_id = log_author_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (family_id, user_id, type, title, link)
  VALUES (
    log_family_id,
    log_author_id,
    'reaction',
    'あなたのログにリアクションがありました',
    '/logs'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_reaction
  AFTER INSERT ON log_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_reaction();

-- コメント通知トリガー
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  log_author_id uuid;
  log_family_id uuid;
BEGIN
  SELECT author_id, family_id INTO log_author_id, log_family_id
  FROM daily_logs WHERE id = NEW.log_id;

  -- 自分自身のログへのコメントは通知しない
  IF NEW.user_id = log_author_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (family_id, user_id, type, title, link)
  VALUES (
    log_family_id,
    log_author_id,
    'comment',
    'あなたのログにコメントがありました',
    '/logs'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON log_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();
