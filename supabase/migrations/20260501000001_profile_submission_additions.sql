-- ─────────────────────────────────────────────────────────
-- Profile and submission additions
--
--  profiles:    email (denormalised from auth.users for convenience)
--               joined_at (explicit membership date, separate from created_at)
--  submissions: title (optional per-submission override of the image title)
-- ─────────────────────────────────────────────────────────

-- ── profiles ─────────────────────────────────────────────
alter table public.profiles
  add column if not exists email     text,
  add column if not exists joined_at timestamptz;

-- ── submissions ───────────────────────────────────────────
alter table public.submissions
  add column if not exists title text;  -- null means use the image's own title

-- ── Back-fill email from auth.users ──────────────────────
-- Keeps the denormalised column in sync for any profiles that already exist.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

-- ── Keep email in sync on future sign-ups ─────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;
-- (trigger on_auth_user_created already exists — the function replacement is enough)
