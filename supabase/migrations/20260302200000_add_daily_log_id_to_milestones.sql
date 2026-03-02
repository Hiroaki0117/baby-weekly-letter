-- milestones に daily_log_id を追加（ログとマイルストーンの紐付け）
alter table milestones
  add column daily_log_id uuid references daily_logs(id) on delete set null;

create index idx_milestones_daily_log_id on milestones(daily_log_id);
