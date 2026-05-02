-- ─────────────────────────────────────────────────────────
-- Fix handle_new_user trigger
--
-- Previous version wrote display_name + email only.
-- This version additionally sets:
--   club_id   → default club (single-tenant seam; swap lookup when multi-tenant)
--   joined_at → timestamp of signup
--   first_name / last_name → from auth metadata (carried over from earlier migration)
--
-- The on conflict … do update clause is intentionally conservative:
-- coalesce() means an existing club_id or joined_at is never overwritten
-- if the trigger somehow fires twice for the same user.
-- ─────────────────────────────────────────────────────────

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

  insert into public.profiles (
    id,
    display_name,
    email,
    first_name,
    last_name,
    club_id,
    joined_at
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

  return new;
end;
$$;
