-- Custom navigation tabs (up to 2)
create table if not exists public.nav_custom_tabs (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null,
  sort_order  smallint    not null default 0,
  created_at  timestamptz not null default now()
);

create unique index if not exists nav_custom_tabs_slug_idx on public.nav_custom_tabs (slug);

-- Custom pages (within system tabs or custom tabs)
create table if not exists public.nav_custom_pages (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  slug          text        not null,
  parent_system text        check (parent_system in ('images','competitions','our-club')),
  tab_id        uuid        references public.nav_custom_tabs(id) on delete cascade,
  page_type     text        not null default 'rich_text'
                            check (page_type in ('rich_text','document_link','external_link')),
  content       text,
  document_id   uuid,
  external_url  text,
  visibility    text        not null default 'all_members'
                            check (visibility in ('all_members','members_only','hidden')),
  sort_order    smallint    not null default 0,
  created_at    timestamptz not null default now()
);

-- RLS
alter table public.nav_custom_tabs enable row level security;
create policy "public read nav tabs"   on public.nav_custom_tabs for select using (true);
create policy "admin write nav tabs"   on public.nav_custom_tabs for all
  using (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));

alter table public.nav_custom_pages enable row level security;
create policy "public read nav pages"  on public.nav_custom_pages for select using (true);
create policy "admin write nav pages"  on public.nav_custom_pages for all
  using (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));
