-- daily_logs の DELETE ポリシーを author_id ベースから family_id ベースに変更
-- 同じ家族のメンバーが書いたログを削除できるようにする
DROP POLICY IF EXISTS delete_own_authored_logs ON daily_logs;

CREATE POLICY delete_family_logs ON daily_logs
  FOR DELETE USING (family_id = my_family_id());
