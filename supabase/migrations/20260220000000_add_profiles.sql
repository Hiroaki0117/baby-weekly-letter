-- ============================================
-- profiles テーブル追加マイグレーション
-- ============================================

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name text,
  child_birth_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_profile ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_profile ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_profile ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- updated_at トリガー（関数は initial migration で作成済み）
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
