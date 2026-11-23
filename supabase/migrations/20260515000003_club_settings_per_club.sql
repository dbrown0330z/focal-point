-- ─────────────────────────────────────────────────────────────────────────────
-- Make singleton club tables per-club
--
-- club_settings, about_page_content unique index, meeting_locations,
-- and member_classes all gain club_id and proper per-club constraints.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. club_settings: remove singleton, add per-club unique ───────────────────

alter table public.club_settings
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

do $$
declare default_id uuid;
begin
  select id into default_id from public.clubs where slug = 'default' limit 1;
  update public.club_settings set club_id = default_id where club_id is null;
end $$;

drop index if exists club_settings_singleton;

create unique index if not exists club_settings_per_club
  on public.club_settings (club_id);

-- Update RLS: scope reads and writes to the club
drop policy if exists "admins manage club settings" on public.club_settings;
drop policy if exists "members read club settings"  on public.club_settings;

create policy "club_settings: member read"
  on public.club_settings for select
  using (is_club_member(club_id) or is_club_admin(club_id) or is_fp_admin());

create policy "club_settings: admin manage"
  on public.club_settings for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── 2. about_page_content: fix unique index to include club_id ────────────────
-- Old index enforced global uniqueness on section_key; needs to be per-club.

drop index if exists about_page_content_key_idx;

create unique index if not exists about_page_content_club_key
  on public.about_page_content (club_id, section_key);

-- Update RLS
drop policy if exists "about_page_content: public read" on public.about_page_content;
drop policy if exists "about_page_content: admin write" on public.about_page_content;

create policy "about_page_content: public read"
  on public.about_page_content for select
  using (true);

create policy "about_page_content: admin manage"
  on public.about_page_content for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── 3. meeting_locations: add club_id ────────────────────────────────────────

alter table public.meeting_locations
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

do $$
declare default_id uuid;
begin
  select id into default_id from public.clubs where slug = 'default' limit 1;
  update public.meeting_locations set club_id = default_id where club_id is null;
end $$;

drop policy if exists "admins manage meeting locations" on public.meeting_locations;
drop policy if exists "members read meeting locations"  on public.meeting_locations;

create policy "meeting_locations: member read"
  on public.meeting_locations for select
  using (is_club_member(club_id) or is_club_admin(club_id));

create policy "meeting_locations: admin manage"
  on public.meeting_locations for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── 4. member_classes: add club_id ───────────────────────────────────────────

alter table public.member_classes
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

do $$
declare default_id uuid;
begin
  select id into default_id from public.clubs where slug = 'default' limit 1;
  update public.member_classes set club_id = default_id where club_id is null;
end $$;

drop policy if exists "admins manage member classes"   on public.member_classes;
drop policy if exists "members read member classes"    on public.member_classes;

create policy "member_classes: member read"
  on public.member_classes for select
  using (is_club_member(club_id) or is_club_admin(club_id));

create policy "member_classes: admin manage"
  on public.member_classes for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());
