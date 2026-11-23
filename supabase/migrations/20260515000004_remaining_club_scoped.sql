-- ─────────────────────────────────────────────────────────────────────────────
-- Add club_id to remaining club-scoped tables
--
-- competition_defaults, competition_default_categories, competition_templates,
-- judge_directory — all gain club_id and updated constraints/policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. competition_defaults: remove singleton, add per-club ───────────────────

alter table public.competition_defaults
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

do $$
declare default_id uuid;
begin
  select id into default_id from public.clubs where slug = 'default' limit 1;
  update public.competition_defaults set club_id = default_id where club_id is null;
end $$;

drop index if exists competition_defaults_singleton;

create unique index if not exists competition_defaults_per_club
  on public.competition_defaults (club_id);

drop policy if exists "club admins manage competition defaults"      on public.competition_defaults;
drop policy if exists "authenticated read competition defaults"      on public.competition_defaults;
drop policy if exists "Club admin manages competition_defaults"      on public.competition_defaults;

create policy "competition_defaults: member read"
  on public.competition_defaults for select
  using (is_club_member(club_id) or is_club_admin(club_id));

create policy "competition_defaults: admin manage"
  on public.competition_defaults for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── 2. competition_default_categories: add club_id ───────────────────────────

alter table public.competition_default_categories
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

do $$
declare default_id uuid;
begin
  select id into default_id from public.clubs where slug = 'default' limit 1;
  update public.competition_default_categories set club_id = default_id where club_id is null;
end $$;

drop policy if exists "Admins manage competition default categories"     on public.competition_default_categories;
drop policy if exists "Authenticated read competition default categories" on public.competition_default_categories;

create policy "competition_default_categories: member read"
  on public.competition_default_categories for select
  using (is_club_member(club_id) or is_club_admin(club_id));

create policy "competition_default_categories: admin manage"
  on public.competition_default_categories for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── 3. competition_templates: add club_id ────────────────────────────────────

alter table public.competition_templates
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

do $$
declare default_id uuid;
begin
  select id into default_id from public.clubs where slug = 'default' limit 1;
  update public.competition_templates set club_id = default_id where club_id is null;
end $$;

drop policy if exists "admins manage competition templates" on public.competition_templates;
drop policy if exists "members read competition templates"  on public.competition_templates;

create policy "competition_templates: member read"
  on public.competition_templates for select
  using (is_club_member(club_id) or is_club_admin(club_id));

create policy "competition_templates: admin manage"
  on public.competition_templates for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── 4. judge_directory: add club_id, fix email uniqueness ────────────────────
-- Email was globally unique; in multi-tenant the same judge can be in
-- multiple clubs, so uniqueness must be per-club.

alter table public.judge_directory
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

do $$
declare default_id uuid;
begin
  select id into default_id from public.clubs where slug = 'default' limit 1;
  update public.judge_directory set club_id = default_id where club_id is null;
end $$;

-- Drop global email unique; replace with per-club composite unique
alter table public.judge_directory
  drop constraint if exists judge_directory_email_key;

create unique index if not exists judge_directory_club_email
  on public.judge_directory (club_id, email);

drop policy if exists "admins can manage judge directory" on public.judge_directory;

create policy "judge_directory: admin manage"
  on public.judge_directory for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());
