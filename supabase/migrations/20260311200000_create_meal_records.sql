-- 食事記録テーブル
CREATE TABLE meal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  meal_date date NOT NULL,
  meal_type text NOT NULL,
  amount text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meal_type_check CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  CONSTRAINT meal_amount_check CHECK (amount IN ('plenty', 'normal', 'little', 'none'))
);

-- インデックス
CREATE INDEX idx_meal_records_child_date ON meal_records(child_id, meal_date);

-- RLS
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_meal ON meal_records FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

CREATE POLICY insert_family_meal ON meal_records FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

CREATE POLICY update_family_meal ON meal_records FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

CREATE POLICY delete_family_meal ON meal_records FOR DELETE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id = (SELECT my_family_id())
  ));

-- updated_at トリガー
CREATE TRIGGER meal_records_updated_at
  BEFORE UPDATE ON meal_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
