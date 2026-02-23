-- ============================================
-- 月次まとめ (monthly_reports) テーブル追加
-- ============================================

CREATE TABLE monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,  -- 月初日 e.g. '2026-02-01'
  content text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source_weekly_report_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX idx_monthly_reports_user_month ON monthly_reports(user_id, month);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_monthly_reports ON monthly_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_monthly_reports ON monthly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_monthly_reports ON monthly_reports
  FOR UPDATE USING (auth.uid() = user_id);
