-- 通信設定テーブル（ユーザーごとのトーン・セクション構成）
create table if not exists report_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tone text not null default 'warm',
  sections text[] not null default '{highlight,digest,growth}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_preferences_user_id_key unique (user_id),
  constraint report_preferences_tone_check check (tone in ('warm', 'humor', 'neutral', 'poetic'))
);

-- RLS
alter table report_preferences enable row level security;

create policy "自分の設定を参照できる"
  on report_preferences for select
  using (auth.uid() = user_id);

create policy "自分の設定を作成できる"
  on report_preferences for insert
  with check (auth.uid() = user_id);

create policy "自分の設定を更新できる"
  on report_preferences for update
  using (auth.uid() = user_id);

-- updated_at 自動更新トリガー
create or replace trigger update_report_preferences_updated_at
  before update on report_preferences
  for each row
  execute function update_updated_at();
