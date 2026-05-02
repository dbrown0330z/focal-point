-- ─────────────────────────────────────────────────────────────────────────────
-- RLS overhaul
--
-- Fixes two security bugs, upgrades admin-only-read policies to full manage,
-- and fills gaps in member-to-member visibility.
--
-- Judge access model (unchanged): judge portal operations go exclusively
-- through service-role server actions, which bypass RLS entirely.
-- No permissive client-facing policies are needed for judge_tokens or scores.
--
-- Multi-tenancy note: club_id columns were added in 20260501000000.
-- Helper current_user_club_id() is provided here for future use; existing
-- policies are not yet club-scoped (single-tenant MVP).
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Helper: current user's club_id
--    Stable, security-definer — call this in future multi-tenant policies
--    instead of repeating the subquery.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function current_user_club_id()
returns uuid
language sql
security definer stable set search_path = ''
as $$
  select club_id from public.profiles where id = auth.uid()
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SECURITY FIX — judge_tokens: remove public read
--
--    "Public can read judge tokens" using (true) exposed every judge's token
--    to any unauthenticated caller.  Token validation happens server-side via
--    the service role, which bypasses RLS — no permissive client policy needed.
--    Admins retain full access via the existing "Admins can manage judge tokens"
--    for-all policy.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Public can read judge tokens" on public.judge_tokens;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SECURITY FIX — nav_custom_pages: filter by status and visibility
--
--    "public read nav pages" using (true) exposed draft pages and admin-hidden
--    pages to every visitor.  Replace with three correctly-scoped policies:
--
--    Public visitors  → published + all_members only
--    Approved members → published + all_members or members_only
--    Admins           → already covered by "admin write nav pages" for-all
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "public read nav pages" on public.nav_custom_pages;

create policy "nav_custom_pages: public read"
  on public.nav_custom_pages for select
  using (
    status     = 'published'
    and visibility = 'all_members'
  );

create policy "nav_custom_pages: member read"
  on public.nav_custom_pages for select
  using (
    is_approved_member()
    and status = 'published'
    and visibility in ('all_members', 'members_only')
  );

-- (admin select is already covered by the existing "admin write nav pages" for-all policy)


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. clubs: allow public and members to read basic club info
--
--    The previous admin-only read policy broke public marketing pages that
--    need the club name and slug.  Club metadata is not sensitive.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "clubs: admin read" on public.clubs;

create policy "clubs: public read"
  on public.clubs for select
  using (true);

-- (write policy "clubs: admin write" is unchanged)


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. profiles: member directory read
--
--    Approved members need to see other members' profiles for the member
--    directory, competition result attribution, and image captions.
--    The existing "Users can read own profile" covers self-read; this policy
--    extends visibility to all active members.
--
--    Sensitive admin fields (role, membership_status, member_number) are
--    filtered in application code — not at the RLS layer for MVP.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "profiles: member directory read"
  on public.profiles for select
  using (is_approved_member());


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. images: approved members can read all images
--
--    Members need to browse the shared library, view competition entries, and
--    see club galleries.  The existing "Members can manage own images" for-all
--    only covers the owner.  This adds cross-member visibility.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "images: member read"
  on public.images for select
  using (is_approved_member());


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. images: admin full manage (replaces admin select-only)
--
--    Admins need to delete images for moderation.  The previous policy was
--    SELECT-only, leaving no DB-level protection against admin write gaps.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Admins can read all images" on public.images;

create policy "images: admin manage"
  on public.images for all
  using    (is_admin())
  with check (is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. submissions: admin full manage (replaces admin select-only)
--
--    Admins need to withdraw, reassign, or remove submissions — not just view.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Admins can read all submissions" on public.submissions;

create policy "submissions: admin manage"
  on public.submissions for all
  using    (is_admin())
  with check (is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. scores: admin full manage (replaces admin select-only)
--
--    Admins need to delete or override scores (e.g., disqualification,
--    judge error).
--
--    Score WRITES from judges continue to go via service-role server actions
--    and are unaffected by this change.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Admins can read all scores" on public.scores;

create policy "scores: admin manage"
  on public.scores for all
  using    (is_admin())
  with check (is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. storage — images bucket: admin manage
--
--     Admins need to delete any member's stored image file (moderation) and
--     may need to upload on behalf of members.  The existing member policies
--     (upload-to-own-folder, delete-own, update-own, public-select) remain
--     unchanged.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "images bucket: admin manage"
  on storage.objects for all
  to authenticated
  using     (bucket_id = 'images' and is_admin())
  with check (bucket_id = 'images' and is_admin());
