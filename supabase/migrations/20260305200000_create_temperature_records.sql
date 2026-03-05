-- 体温記録テーブル
CREATE TABLE temperature_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL,
  temperature numeric(3,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temperature_range CHECK (temperature >= 34.0 AND temperature <= 42.0)
);

CREATE INDEX idx_temperature_records_child_measured ON temperature_records(child_id, measured_at);

-- RLS
ALTER TABLE temperature_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_temperature ON temperature_records FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

CREATE POLICY insert_family_temperature ON temperature_records FOR INSERT WITH CHECK (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

CREATE POLICY update_family_temperature ON temperature_records FOR UPDATE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

CREATE POLICY delete_family_temperature ON temperature_records FOR DELETE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);
