alter table public.club_settings
  add column if not exists member_classes_enabled boolean not null default false;
