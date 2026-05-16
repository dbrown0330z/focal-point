-- ─────────────────────────────────────────────────────────────────────────────
-- Update RLS policies on major tables to be properly club-scoped
--
-- Replaces the old is_admin() / is_approved_member() policies (which had no
-- club context) with is_club_admin(club_id) / is_club_member(club_id) calls
-- that use the club_id column on each row as the isolation boundary.
--
-- A user can only read/write rows that belong to a club they are a member of.
-- FP super-admins (is_fp_admin()) can access all clubs.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── images ───────────────────────────────────────────────────────────────────

drop policy if exists "Members can manage own images" on public.images;
drop policy if exists "images: member read"           on public.images;
drop policy if exists "images: admin manage"          on public.images;

create policy "images: owner manage"
  on public.images for all
  using    (owner_id = auth.uid() and is_club_member(club_id));

create policy "images: member read"
  on public.images for select
  using (is_club_member(club_id));

create policy "images: admin manage"
  on public.images for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── competitions ─────────────────────────────────────────────────────────────

drop policy if exists "Approved members can read non-draft competitions" on public.competitions;
drop policy if exists "Admins can manage competitions"                   on public.competitions;

create policy "competitions: member read"
  on public.competitions for select
  using (is_club_member(club_id) and status != 'draft');

create policy "competitions: admin manage"
  on public.competitions for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── competition_categories ───────────────────────────────────────────────────

drop policy if exists "Approved members can read categories" on public.competition_categories;
drop policy if exists "Admins can manage categories"         on public.competition_categories;

create policy "competition_categories: member read"
  on public.competition_categories for select
  using (is_club_member(club_id));

create policy "competition_categories: admin manage"
  on public.competition_categories for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── submissions ──────────────────────────────────────────────────────────────

drop policy if exists "Members can manage own submissions" on public.submissions;
drop policy if exists "submissions: admin manage"          on public.submissions;

-- Members manage their own submissions
create policy "submissions: member manage own"
  on public.submissions for all
  using    (member_id = auth.uid() and is_club_member(club_id));

-- Members can read all submissions in their club (results pages need this)
create policy "submissions: member read all"
  on public.submissions for select
  using (is_club_member(club_id));

create policy "submissions: admin manage"
  on public.submissions for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── posts ────────────────────────────────────────────────────────────────────

drop policy if exists "Approved members can read published posts" on public.posts;
drop policy if exists "Admins can manage posts"                   on public.posts;

create policy "posts: member read"
  on public.posts for select
  using (
    is_club_member(club_id)
    and published_at is not null
    and published_at <= now()
  );

create policy "posts: admin manage"
  on public.posts for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── calendar_events ──────────────────────────────────────────────────────────

drop policy if exists "members can view events"  on public.calendar_events;
drop policy if exists "admins can manage events" on public.calendar_events;

create policy "calendar_events: member read"
  on public.calendar_events for select
  using (is_club_member(club_id));

create policy "calendar_events: admin manage"
  on public.calendar_events for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── documents ────────────────────────────────────────────────────────────────

drop policy if exists "documents: member read" on public.documents;
drop policy if exists "documents: admin write" on public.documents;

create policy "documents: member read"
  on public.documents for select
  using (
    deleted_at is null
    and visibility = 'members'
    and is_club_member(club_id)
  );

create policy "documents: public read"
  on public.documents for select
  using (deleted_at is null and visibility = 'public');

create policy "documents: admin manage"
  on public.documents for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── document_categories ──────────────────────────────────────────────────────

drop policy if exists "document_categories: member read"  on public.document_categories;
drop policy if exists "document_categories: admin write"  on public.document_categories;

create policy "document_categories: member read"
  on public.document_categories for select
  using (is_club_member(club_id) or is_club_admin(club_id));

create policy "document_categories: admin manage"
  on public.document_categories for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── nav_custom_pages ─────────────────────────────────────────────────────────

drop policy if exists "nav_custom_pages: public read" on public.nav_custom_pages;
drop policy if exists "nav_custom_pages: member read" on public.nav_custom_pages;
drop policy if exists "admin write nav pages"         on public.nav_custom_pages;

create policy "nav_custom_pages: public read"
  on public.nav_custom_pages for select
  using (status = 'published' and visibility = 'all_members');

create policy "nav_custom_pages: member read"
  on public.nav_custom_pages for select
  using (
    is_club_member(club_id)
    and status     = 'published'
    and visibility in ('all_members', 'members_only')
  );

create policy "nav_custom_pages: admin manage"
  on public.nav_custom_pages for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── nav_custom_tabs ──────────────────────────────────────────────────────────

drop policy if exists "public read nav tabs" on public.nav_custom_tabs;
drop policy if exists "admin write nav tabs" on public.nav_custom_tabs;

create policy "nav_custom_tabs: member read"
  on public.nav_custom_tabs for select
  using (is_club_member(club_id));

create policy "nav_custom_tabs: admin manage"
  on public.nav_custom_tabs for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());

-- ── pages ────────────────────────────────────────────────────────────────────

drop policy if exists "about_page: public read"  on public.pages;
drop policy if exists "about_page: admin write"  on public.pages;

create policy "pages: public read"
  on public.pages for select
  using (true);

create policy "pages: admin manage"
  on public.pages for all
  using    (is_club_admin(club_id) or is_fp_admin())
  with check (is_club_admin(club_id) or is_fp_admin());
