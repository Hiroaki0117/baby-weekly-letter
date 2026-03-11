-- 睡眠区分カラム追加（night: 夜間睡眠 / daytime: 日中睡眠）
ALTER TABLE sleep_records
  ADD COLUMN sleep_category text;

-- 既存レコードのバックフィル（started_at を JST に変換して時刻で判定）
UPDATE sleep_records
SET sleep_category = CASE
  WHEN EXTRACT(HOUR FROM started_at AT TIME ZONE 'Asia/Tokyo') >= 19
    OR EXTRACT(HOUR FROM started_at AT TIME ZONE 'Asia/Tokyo') < 6
  THEN 'night'
  ELSE 'daytime'
END;

-- NOT NULL 制約を追加
ALTER TABLE sleep_records
  ALTER COLUMN sleep_category SET NOT NULL;

-- CHECK 制約
ALTER TABLE sleep_records
  ADD CONSTRAINT sleep_category_check CHECK (sleep_category IN ('night', 'daytime'));
