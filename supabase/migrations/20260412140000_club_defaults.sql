-- Club settings (single row — enforced by partial unique index)
create table public.club_settings (
  id                  uuid        primary key default gen_random_uuid(),
  club_name           text        not null default '',
  club_short_name     text,
  club_location       text,
  timezone            text        not null default 'America/New_York',
  logo_path           text,
  season_start_month  smallint    not null default 9,
  season_end_month    smallint    not null default 8,
  updated_at          timestamptz not null default now()
);

-- Seed with one empty row so the page always has something to upsert into
insert into public.club_settings default values;

create unique index club_settings_singleton on public.club_settings ((true));

-- Meeting locations
create table public.meeting_locations (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  address     text,
  sort_order  smallint    not null default 0,
  created_at  timestamptz not null default now()
);

-- Member classes
create table public.member_classes (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  sort_order  smallint    not null default 0,
  created_at  timestamptz not null default now()
);

-- Storage bucket for club assets (logo etc.)
insert into storage.buckets (id, name, public)
values ('club-assets', 'club-assets', true)
on conflict (id) do nothing;

-- RLS
alter table public.club_settings enable row level security;
create policy "admins manage club settings"
  on public.club_settings for all to authenticated
  using   (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "members read club settings"
  on public.club_settings for select to authenticated using (true);

alter table public.meeting_locations enable row level security;
create policy "admins manage meeting locations"
  on public.meeting_locations for all to authenticated
  using   (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "members read meeting locations"
  on public.meeting_locations for select to authenticated using (true);

alter table public.member_classes enable row level security;
create policy "admins manage member classes"
  on public.member_classes for all to authenticated
  using   (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "members read member classes"
  on public.member_classes for select to authenticated using (true);

-- Storage policies
create policy "admins upload club assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'club-assets' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "public read club assets"
  on storage.objects for select using (bucket_id = 'club-assets');
create policy "admins delete club assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'club-assets' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
