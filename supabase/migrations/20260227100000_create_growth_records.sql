-- 成長記録テーブル
CREATE TABLE growth_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  measured_date date NOT NULL,
  height_cm numeric(5,1),
  weight_kg numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT height_or_weight CHECK (height_cm IS NOT NULL OR weight_kg IS NOT NULL)
);

CREATE INDEX idx_growth_records_child_date ON growth_records(child_id, measured_date);

-- RLS
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_growth ON growth_records FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

CREATE POLICY insert_family_growth ON growth_records FOR INSERT WITH CHECK (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

CREATE POLICY update_family_growth ON growth_records FOR UPDATE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);

CREATE POLICY delete_family_growth ON growth_records FOR DELETE USING (
  child_id IN (SELECT id FROM children WHERE family_id = my_family_id())
);
