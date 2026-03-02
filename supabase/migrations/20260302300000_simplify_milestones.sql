-- マイルストーン簡素化: 記録の「初めての出来事」フラグに変更
-- AI抽出データ（daily_log_id IS NULL）を削除し、不要カラムを除去

-- Step 1: AI抽出分（ログ未紐付け）のデータを削除
DELETE FROM milestones WHERE daily_log_id IS NULL;

-- Step 2: daily_log_id を NOT NULL 化
ALTER TABLE milestones ALTER COLUMN daily_log_id SET NOT NULL;

-- Step 3: 不要カラムを削除
ALTER TABLE milestones DROP COLUMN IF EXISTS category;
ALTER TABLE milestones DROP COLUMN IF EXISTS source;
ALTER TABLE milestones DROP COLUMN IF EXISTS weekly_report_id;
ALTER TABLE milestones DROP COLUMN IF EXISTS memo;
