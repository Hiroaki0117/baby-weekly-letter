-- annual_reports テーブル作成
CREATE TABLE annual_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  fiscal_year integer NOT NULL,
  content jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(family_id, child_id, fiscal_year)
);

-- インデックス
CREATE INDEX idx_annual_reports_child_fiscal ON annual_reports(child_id, fiscal_year);

-- RLS 有効化
ALTER TABLE annual_reports ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー
CREATE POLICY select_family_annual ON annual_reports FOR SELECT
  USING (family_id = my_family_id());

CREATE POLICY insert_family_annual ON annual_reports FOR INSERT
  WITH CHECK (family_id = my_family_id());

CREATE POLICY update_family_annual ON annual_reports FOR UPDATE
  USING (family_id = my_family_id());
