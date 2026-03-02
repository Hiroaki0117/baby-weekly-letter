-- daily_log_id の外部キーを ON DELETE CASCADE に変更
-- ログ削除時にマイルストーンも自動削除されるようにする

ALTER TABLE milestones
  DROP CONSTRAINT IF EXISTS milestones_daily_log_id_fkey;

ALTER TABLE milestones
  ADD CONSTRAINT milestones_daily_log_id_fkey
  FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE;
