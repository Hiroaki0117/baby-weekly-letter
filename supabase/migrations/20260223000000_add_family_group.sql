-- ============================================
-- 家族グループ機能マイグレーション
-- データ所有単位を user_id → family_id に変更
-- ============================================

-- ============================================
-- 1. 新規テーブル作成
-- ============================================

-- families: 家族の単位
CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- family_members: ユーザーと家族の紐付け
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'member')),
  display_name text,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_family_members_user ON family_members(user_id);

-- children: 子どもの情報（profiles から分離）
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text,
  birth_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_children_family ON children(family_id);

CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- family_invitations: 招待リンク管理
CREATE TABLE family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_invitations_token ON family_invitations(token);
CREATE INDEX idx_family_invitations_family ON family_invitations(family_id);

-- ============================================
-- 2. 既存ユーザーのデータ移行
-- ============================================

-- 既存ユーザーごとに family を自動作成し、family_members(owner) に追加
-- また profiles の child_name/child_birth_date を children にコピー
DO $$
DECLARE
  r RECORD;
  new_family_id uuid;
BEGIN
  FOR r IN
    SELECT p.user_id, p.child_name, p.child_birth_date
    FROM profiles p
  LOOP
    -- 家族作成
    INSERT INTO families (name)
    VALUES ('マイファミリー')
    RETURNING id INTO new_family_id;

    -- メンバー追加（owner）
    INSERT INTO family_members (family_id, user_id, role)
    VALUES (new_family_id, r.user_id, 'owner');

    -- 子ども情報コピー（存在する場合）
    IF r.child_name IS NOT NULL OR r.child_birth_date IS NOT NULL THEN
      INSERT INTO children (family_id, name, birth_date)
      VALUES (new_family_id, r.child_name, r.child_birth_date);
    END IF;
  END LOOP;

  -- profiles がないが auth.users にいるユーザーも対応
  FOR r IN
    SELECT u.id AS user_id
    FROM auth.users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN family_members fm ON fm.user_id = u.id
    WHERE p.user_id IS NULL AND fm.user_id IS NULL
  LOOP
    INSERT INTO families (name)
    VALUES ('マイファミリー')
    RETURNING id INTO new_family_id;

    INSERT INTO family_members (family_id, user_id, role)
    VALUES (new_family_id, r.user_id, 'owner');
  END LOOP;
END;
$$;

-- ============================================
-- 3. daily_logs: user_id → author_id + family_id
-- ============================================

-- author_id カラム追加（user_id のコピー）
ALTER TABLE daily_logs ADD COLUMN author_id uuid REFERENCES auth.users(id);
UPDATE daily_logs SET author_id = user_id;
ALTER TABLE daily_logs ALTER COLUMN author_id SET NOT NULL;

-- family_id カラム追加
ALTER TABLE daily_logs ADD COLUMN family_id uuid REFERENCES families(id) ON DELETE CASCADE;
UPDATE daily_logs dl
SET family_id = fm.family_id
FROM family_members fm
WHERE fm.user_id = dl.user_id;
ALTER TABLE daily_logs ALTER COLUMN family_id SET NOT NULL;

-- 旧 user_id カラム削除
ALTER TABLE daily_logs DROP COLUMN user_id;

-- インデックス再作成
DROP INDEX IF EXISTS idx_daily_logs_user_date;
CREATE INDEX idx_daily_logs_family_date ON daily_logs(family_id, log_date);
CREATE INDEX idx_daily_logs_author ON daily_logs(author_id);

-- ============================================
-- 4. weekly_reports: user_id → family_id
-- ============================================

-- family_id カラム追加
ALTER TABLE weekly_reports ADD COLUMN family_id uuid REFERENCES families(id) ON DELETE CASCADE;
UPDATE weekly_reports wr
SET family_id = fm.family_id
FROM family_members fm
WHERE fm.user_id = wr.user_id;
ALTER TABLE weekly_reports ALTER COLUMN family_id SET NOT NULL;

-- UNIQUE 制約変更
ALTER TABLE weekly_reports DROP CONSTRAINT weekly_reports_user_id_week_start_key;
ALTER TABLE weekly_reports ADD CONSTRAINT weekly_reports_family_id_week_start_key UNIQUE(family_id, week_start);

-- 旧 user_id カラム削除
ALTER TABLE weekly_reports DROP COLUMN user_id;

-- インデックス再作成
DROP INDEX IF EXISTS idx_weekly_reports_user_week;
CREATE INDEX idx_weekly_reports_family_week ON weekly_reports(family_id, week_start);

-- ============================================
-- 5. monthly_reports: user_id → family_id
-- ============================================

-- family_id カラム追加
ALTER TABLE monthly_reports ADD COLUMN family_id uuid REFERENCES families(id) ON DELETE CASCADE;
UPDATE monthly_reports mr
SET family_id = fm.family_id
FROM family_members fm
WHERE fm.user_id = mr.user_id;
ALTER TABLE monthly_reports ALTER COLUMN family_id SET NOT NULL;

-- UNIQUE 制約変更
ALTER TABLE monthly_reports DROP CONSTRAINT monthly_reports_user_id_month_key;
ALTER TABLE monthly_reports ADD CONSTRAINT monthly_reports_family_id_month_key UNIQUE(family_id, month);

-- 旧 user_id カラム削除
ALTER TABLE monthly_reports DROP COLUMN user_id;

-- インデックス再作成
DROP INDEX IF EXISTS idx_monthly_reports_user_month;
CREATE INDEX idx_monthly_reports_family_month ON monthly_reports(family_id, month);

-- ============================================
-- 6. profiles: child 情報削除、display_name 追加
-- ============================================

ALTER TABLE profiles DROP COLUMN IF EXISTS child_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS child_birth_date;
ALTER TABLE profiles ADD COLUMN display_name text;

-- ============================================
-- 7. ヘルパー関数
-- ============================================

-- 現在のユーザーが所属する family_id を返す
CREATE OR REPLACE FUNCTION my_family_id()
RETURNS uuid AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 招待トークン検証関数（未参加ユーザーが RLS を介さずに招待を検証するため）
CREATE OR REPLACE FUNCTION verify_invitation(invite_token text)
RETURNS TABLE(family_id uuid, family_name text) AS $$
  SELECT f.id AS family_id, f.name AS family_name
  FROM family_invitations fi
  JOIN families f ON f.id = fi.family_id
  WHERE fi.token = invite_token
    AND fi.expires_at > now()
    AND fi.used_by IS NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 招待使用済み更新関数
CREATE OR REPLACE FUNCTION use_invitation(invite_token text, used_by_user uuid)
RETURNS void AS $$
  UPDATE family_invitations
  SET used_by = used_by_user, used_at = now()
  WHERE token = invite_token;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 8. 旧 RLS ポリシー削除
-- ============================================

-- daily_logs
DROP POLICY IF EXISTS select_own_logs ON daily_logs;
DROP POLICY IF EXISTS insert_own_logs ON daily_logs;
DROP POLICY IF EXISTS update_own_logs ON daily_logs;
DROP POLICY IF EXISTS delete_own_logs ON daily_logs;

-- weekly_reports
DROP POLICY IF EXISTS select_own_reports ON weekly_reports;
DROP POLICY IF EXISTS insert_own_reports ON weekly_reports;
DROP POLICY IF EXISTS update_own_reports ON weekly_reports;

-- monthly_reports
DROP POLICY IF EXISTS select_own_monthly_reports ON monthly_reports;
DROP POLICY IF EXISTS insert_own_monthly_reports ON monthly_reports;
DROP POLICY IF EXISTS update_own_monthly_reports ON monthly_reports;

-- profiles
DROP POLICY IF EXISTS select_own_profile ON profiles;
DROP POLICY IF EXISTS insert_own_profile ON profiles;
DROP POLICY IF EXISTS update_own_profile ON profiles;

-- ============================================
-- 9. 新 RLS ポリシー作成
-- ============================================

-- families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_family ON families
  FOR SELECT USING (id = my_family_id());
CREATE POLICY insert_family ON families
  FOR INSERT WITH CHECK (true);  -- 誰でも家族を作成できる（オンボーディング時）
CREATE POLICY update_own_family ON families
  FOR UPDATE USING (
    id = my_family_id()
    AND EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = families.id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_members ON family_members
  FOR SELECT USING (family_id = my_family_id());
CREATE POLICY insert_family_members ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());  -- 自分自身のメンバーシップのみ作成可能
CREATE POLICY delete_family_members ON family_members
  FOR DELETE USING (
    family_id = my_family_id()
    AND (
      -- owner がメンバーを削除
      EXISTS (
        SELECT 1 FROM family_members fm
        WHERE fm.family_id = family_members.family_id
        AND fm.user_id = auth.uid() AND fm.role = 'owner'
      )
      -- 自分自身の脱退
      OR user_id = auth.uid()
    )
  );

-- children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_children ON children
  FOR SELECT USING (family_id = my_family_id());
CREATE POLICY insert_family_children ON children
  FOR INSERT WITH CHECK (family_id = my_family_id());
CREATE POLICY update_family_children ON children
  FOR UPDATE USING (family_id = my_family_id());

-- family_invitations
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_family_invitations ON family_invitations
  FOR SELECT USING (family_id = my_family_id());
CREATE POLICY insert_family_invitations ON family_invitations
  FOR INSERT WITH CHECK (
    family_id = my_family_id()
    AND EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = family_invitations.family_id
      AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- daily_logs (family ベース + author 制御)
CREATE POLICY select_family_logs ON daily_logs
  FOR SELECT USING (family_id = my_family_id());
CREATE POLICY insert_family_logs ON daily_logs
  FOR INSERT WITH CHECK (family_id = my_family_id() AND author_id = auth.uid());
CREATE POLICY update_own_authored_logs ON daily_logs
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY delete_own_authored_logs ON daily_logs
  FOR DELETE USING (author_id = auth.uid());

-- weekly_reports (family ベース)
CREATE POLICY select_family_weekly ON weekly_reports
  FOR SELECT USING (family_id = my_family_id());
CREATE POLICY insert_family_weekly ON weekly_reports
  FOR INSERT WITH CHECK (family_id = my_family_id());
CREATE POLICY update_family_weekly ON weekly_reports
  FOR UPDATE USING (family_id = my_family_id());

-- monthly_reports (family ベース)
CREATE POLICY select_family_monthly ON monthly_reports
  FOR SELECT USING (family_id = my_family_id());
CREATE POLICY insert_family_monthly ON monthly_reports
  FOR INSERT WITH CHECK (family_id = my_family_id());
CREATE POLICY update_family_monthly ON monthly_reports
  FOR UPDATE USING (family_id = my_family_id());

-- profiles (自分 + 同じ家族のメンバー)
CREATE POLICY select_profile ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.user_id = profiles.user_id
      AND family_members.family_id = my_family_id()
    )
  );
CREATE POLICY insert_own_profile ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY update_own_profile ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 10. Storage ポリシー更新
-- ============================================

-- 旧ポリシー削除
DROP POLICY IF EXISTS storage_select_own ON storage.objects;
DROP POLICY IF EXISTS storage_insert_own ON storage.objects;
DROP POLICY IF EXISTS storage_delete_own ON storage.objects;

-- 新ポリシー: family_id ベース
CREATE POLICY storage_select_family ON storage.objects
  FOR SELECT USING (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = my_family_id()::text
  );

CREATE POLICY storage_insert_family ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = my_family_id()::text
  );

CREATE POLICY storage_delete_family ON storage.objects
  FOR DELETE USING (
    bucket_id = 'log-photos'
    AND (storage.foldername(name))[1] = 'logs'
    AND (storage.foldername(name))[2] = my_family_id()::text
  );
