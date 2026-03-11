-- 睡眠記録テーブル
CREATE TABLE sleep_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  sleep_date date NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sleep_ended_after_started CHECK (ended_at > started_at)
);

-- インデックス
CREATE INDEX idx_sleep_records_child_date ON sleep_records(child_id, sleep_date);

-- RLS
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_sleep ON sleep_records FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

CREATE POLICY insert_family_sleep ON sleep_records FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

CREATE POLICY update_family_sleep ON sleep_records FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

CREATE POLICY delete_family_sleep ON sleep_records FOR DELETE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

-- updated_at トリガー
CREATE TRIGGER sleep_records_updated_at
  BEFORE UPDATE ON sleep_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
