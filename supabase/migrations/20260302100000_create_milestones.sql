-- 成長マイルストーンテーブル
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  title text not null,
  milestone_date date not null,
  category text not null default 'other',
  memo text,
  source text not null default 'manual',
  weekly_report_id uuid references weekly_reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestones_category_check check (category in ('motor', 'language', 'eating', 'lifestyle', 'other')),
  constraint milestones_source_check check (source in ('ai', 'manual'))
);

-- RLS
alter table milestones enable row level security;

create policy "milestones_select" on milestones for select
  using (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

create policy "milestones_insert" on milestones for insert
  with check (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

create policy "milestones_update" on milestones for update
  using (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

create policy "milestones_delete" on milestones for delete
  using (child_id in (
    select id from children where family_id = (select my_family_id())
  ));

-- updated_at トリガー
create trigger milestones_updated_at
  before update on milestones
  for each row execute function update_updated_at();
