-- ─────────────────────────────────────────────────────────────────────────────
-- club_memberships — the multi-tenant membership model
--
-- A user can belong to multiple clubs, each with its own role and status.
-- This replaces club-specific columns on profiles (role, membership_status,
-- membership_class, member_number, club_id, joined_at).
--
-- Those columns are NOT dropped here — they remain on profiles as a deprecated
-- single-tenant fallback while application code is migrated to use this table.
-- They will be removed in a future migration once the app is fully updated.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Create club_memberships ────────────────────────────────────────────────

create table if not exists public.club_memberships (
  id                uuid              primary key default gen_random_uuid(),
  user_id           uuid              not null references auth.users(id)  on delete cascade,
  club_id           uuid              not null references public.clubs(id) on delete cascade,
  role              user_role,                                    -- null = pending approval
  membership_status membership_status not null default 'pending',
  membership_class  text,
  member_number     integer,
  joined_at         timestamptz       not null default now(),
  created_at        timestamptz       not null default now(),

  unique (user_id, club_id)
);

alter table public.club_memberships enable row level security;

-- Members read their own memberships
create policy "club_memberships: self read"
  on public.club_memberships for select
  using (user_id = auth.uid());

-- Club admins read all memberships in their club
create policy "club_memberships: admin read"
  on public.club_memberships for select
  using (
    exists (
      select 1 from public.club_memberships cm
      where cm.user_id = auth.uid()
        and cm.club_id = club_memberships.club_id
        and cm.role = 'admin'
        and cm.membership_status = 'active'
    )
  );

-- Club admins manage memberships in their club
create policy "club_memberships: admin manage"
  on public.club_memberships for all
  using (
    exists (
      select 1 from public.club_memberships cm
      where cm.user_id = auth.uid()
        and cm.club_id = club_memberships.club_id
        and cm.role = 'admin'
        and cm.membership_status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.club_memberships cm
      where cm.user_id = auth.uid()
        and cm.club_id = club_memberships.club_id
        and cm.role = 'admin'
        and cm.membership_status = 'active'
    )
  );

-- ── 2. Migrate existing profile data → club_memberships ───────────────────────
-- Every profile that already has a club_id gets a membership row.

insert into public.club_memberships (
  user_id, club_id, role, membership_status,
  membership_class, member_number, joined_at
)
select
  p.id,
  p.club_id,
  p.role,
  p.membership_status,
  p.membership_class,
  p.member_number::integer,
  coalesce(p.joined_at, p.created_at)
from public.profiles p
where p.club_id is not null
on conflict (user_id, club_id) do nothing;

-- ── 3. Update handle_new_user trigger ────────────────────────────────────────
-- Now creates both a profile row and a club_membership row on signup.
-- The club_id used is the default club (single-tenant seam).
-- The multi-tenant signup flow will pass the correct club_id instead.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  default_club_id uuid;
begin
  select id into default_club_id
  from public.clubs
  where slug = 'default'
  limit 1;

  -- Global profile (identity data shared across all clubs)
  insert into public.profiles (
    id, display_name, email, first_name, last_name, club_id, joined_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    default_club_id,
    now()
  )
  on conflict (id) do update
    set email     = excluded.email,
        club_id   = coalesce(public.profiles.club_id,   excluded.club_id),
        joined_at = coalesce(public.profiles.joined_at, excluded.joined_at);

  -- Club membership (pending approval in the default club)
  if default_club_id is not null then
    insert into public.club_memberships (user_id, club_id, membership_status, joined_at)
    values (new.id, default_club_id, 'pending', now())
    on conflict (user_id, club_id) do nothing;
  end if;

  return new;
end;
$$;

-- ── 4. New scoped helper functions ────────────────────────────────────────────

-- Is the current user a Focal Point super-admin?
create or replace function is_fp_admin()
returns boolean
language sql security definer stable set search_path = ''
as $$
  select coalesce(
    (select is_fp_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Is the current user an active admin of a specific club?
create or replace function is_club_admin(p_club_id uuid)
returns boolean
language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.club_memberships
    where user_id = auth.uid()
      and club_id  = p_club_id
      and role     = 'admin'
      and membership_status = 'active'
  )
$$;

-- Is the current user an active member of a specific club?
create or replace function is_club_member(p_club_id uuid)
returns boolean
language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.club_memberships
    where user_id = auth.uid()
      and club_id  = p_club_id
      and membership_status = 'active'
  )
$$;

-- ── 5. Update backward-compat helpers to use club_memberships ─────────────────
-- These are called by existing RLS policies. Keeping signatures identical
-- means no policy changes are needed during the transition.

-- is_admin(): true if admin of any active club, or FP super-admin
create or replace function is_admin()
returns boolean
language sql security definer stable set search_path = ''
as $$
  select (
    exists (
      select 1 from public.club_memberships
      where user_id = auth.uid()
        and role    = 'admin'
        and membership_status = 'active'
    )
    or coalesce((select is_fp_admin from public.profiles where id = auth.uid()), false)
  )
$$;

-- is_approved_member(): true if active member of any club
create or replace function is_approved_member()
returns boolean
language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.club_memberships
    where user_id = auth.uid()
      and membership_status = 'active'
  )
$$;

-- current_user_club_id(): the user's earliest active club (compat; prefer header context in app)
create or replace function current_user_club_id()
returns uuid
language sql security definer stable set search_path = ''
as $$
  select club_id
  from public.club_memberships
  where user_id = auth.uid()
    and membership_status = 'active'
  order by joined_at
  limit 1
$$;
