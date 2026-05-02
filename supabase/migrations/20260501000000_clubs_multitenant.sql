-- ─────────────────────────────────────────────────────────
-- clubs table + club_id multi-tenancy scaffold
--
-- Establishes the isolation seam for future SaaS multi-tenancy.
-- All major tables gain a club_id FK.
-- Existing rows are backfilled to a seeded "default" club.
-- ─────────────────────────────────────────────────────────

-- ── 1. clubs ─────────────────────────────────────────────
create table if not exists public.clubs (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

create policy "clubs: admin read"
  on public.clubs for select
  using (is_admin());

create policy "clubs: admin write"
  on public.clubs for all
  using (is_admin())
  with check (is_admin());

-- ── 2. Seed the single current club ──────────────────────
-- Name is a placeholder; update via the admin UI (club settings).
insert into public.clubs (name, slug)
values ('My Camera Club', 'default')
on conflict (slug) do nothing;

-- ── 3. Add club_id to every major table ──────────────────
alter table public.profiles
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.images
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.competitions
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.competition_categories
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.submissions
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.judge_tokens
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.scores
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.posts
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.calendar_events
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.nav_custom_tabs
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.nav_custom_pages
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.documents
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.pages
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.about_page_content
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

alter table public.document_categories
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

-- ── 4. Backfill all existing rows ────────────────────────
do $$
declare
  seed_id uuid;
begin
  select id into seed_id from public.clubs where slug = 'default' limit 1;

  update public.profiles               set club_id = seed_id where club_id is null;
  update public.images                 set club_id = seed_id where club_id is null;
  update public.competitions           set club_id = seed_id where club_id is null;
  update public.competition_categories set club_id = seed_id where club_id is null;
  update public.submissions            set club_id = seed_id where club_id is null;
  update public.judge_tokens           set club_id = seed_id where club_id is null;
  update public.scores                 set club_id = seed_id where club_id is null;
  update public.posts                  set club_id = seed_id where club_id is null;
  update public.calendar_events        set club_id = seed_id where club_id is null;
  update public.nav_custom_tabs        set club_id = seed_id where club_id is null;
  update public.nav_custom_pages       set club_id = seed_id where club_id is null;
  update public.documents              set club_id = seed_id where club_id is null;
  update public.pages                  set club_id = seed_id where club_id is null;
  update public.about_page_content     set club_id = seed_id where club_id is null;
  update public.document_categories    set club_id = seed_id where club_id is null;
end $$;
