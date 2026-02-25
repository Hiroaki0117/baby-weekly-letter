-- 複数子供対応: daily_logs, weekly_reports, monthly_reports に child_id を追加

-- Step 1: daily_logs に child_id を追加（nullable）
ALTER TABLE daily_logs ADD COLUMN child_id uuid REFERENCES children(id);
CREATE INDEX idx_daily_logs_child ON daily_logs(child_id);

-- Step 2: weekly_reports に child_id を追加（nullable）
ALTER TABLE weekly_reports ADD COLUMN child_id uuid REFERENCES children(id);
DROP INDEX IF EXISTS weekly_reports_family_id_week_start_key;
CREATE UNIQUE INDEX weekly_reports_family_child_week
  ON weekly_reports(family_id, child_id, week_start);

-- Step 3: monthly_reports に child_id を追加（nullable）
ALTER TABLE monthly_reports ADD COLUMN child_id uuid REFERENCES children(id);
DROP INDEX IF EXISTS monthly_reports_family_id_month_key;
CREATE UNIQUE INDEX monthly_reports_family_child_month
  ON monthly_reports(family_id, child_id, month);

-- Step 4: 既存データに最初の子供を割り当て
UPDATE daily_logs
SET child_id = (
  SELECT id FROM children
  WHERE children.family_id = daily_logs.family_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE child_id IS NULL;

UPDATE weekly_reports
SET child_id = (
  SELECT id FROM children
  WHERE children.family_id = weekly_reports.family_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE child_id IS NULL;

UPDATE monthly_reports
SET child_id = (
  SELECT id FROM children
  WHERE children.family_id = monthly_reports.family_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE child_id IS NULL;

-- Step 5: NOT NULL制約を追加
ALTER TABLE daily_logs ALTER COLUMN child_id SET NOT NULL;
ALTER TABLE weekly_reports ALTER COLUMN child_id SET NOT NULL;
ALTER TABLE monthly_reports ALTER COLUMN child_id SET NOT NULL;
