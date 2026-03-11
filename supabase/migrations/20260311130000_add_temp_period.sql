-- 体温の時間区分カラム追加（morning: 朝 / afternoon: 昼 / evening: 夕 / night: 夜）
ALTER TABLE temperature_records
  ADD COLUMN temp_period text;

-- 既存レコードのバックフィル（measured_at を JST に変換して時刻で判定）
UPDATE temperature_records
SET temp_period = CASE
  WHEN EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') >= 5
    AND EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') < 10
  THEN 'morning'
  WHEN EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') >= 10
    AND EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') < 16
  THEN 'afternoon'
  WHEN EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') >= 16
    AND EXTRACT(HOUR FROM measured_at AT TIME ZONE 'Asia/Tokyo') < 20
  THEN 'evening'
  ELSE 'night'
END;

-- NOT NULL 制約を追加
ALTER TABLE temperature_records
  ALTER COLUMN temp_period SET NOT NULL;

-- CHECK 制約
ALTER TABLE temperature_records
  ADD CONSTRAINT temp_period_check CHECK (temp_period IN ('morning', 'afternoon', 'evening', 'night'));
