-- ============================================
-- すくすく日記 初回マイグレーション
-- ============================================

-- daily_logs テーブル
CREATE TABLE daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  text text NOT NULL,
  mood text NOT NULL CHECK (mood IN ('happy', 'neutral', 'sad')),
  categories text[] DEFAULT '{}',
  photo_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date);

-- weekly_reports テーブル
CREATE TABLE weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  content text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source_log_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_reports_user_week ON weekly_reports(user_id, week_start);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- daily_logs
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_logs ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_logs ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_logs ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_logs ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);

-- weekly_reports
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_reports ON weekly_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_reports ON weekly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_reports ON weekly_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Storage バケット & ポリシー
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('log-photos', 'log-photos', false);

CREATE POLICY storage_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY storage_insert_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY storage_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
