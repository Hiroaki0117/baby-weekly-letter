-- 睡眠計測中状態を家族間で共有するためのテーブル
CREATE TABLE sleep_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_by uuid NOT NULL REFERENCES auth.users(id),
  started_at timestamptz NOT NULL,
  sleep_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id)
);

ALTER TABLE sleep_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family members can view tracking"
  ON sleep_tracking FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "family members can start tracking"
  ON sleep_tracking FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "family members can stop tracking"
  ON sleep_tracking FOR DELETE
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
