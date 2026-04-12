-- Extend membership_status enum
alter type membership_status add value if not exists 'paused';
alter type membership_status add value if not exists 'complimentary';
alter type membership_status add value if not exists 'banned';
alter type membership_status add value if not exists 'cancelled';

-- Add first_name, last_name, membership_class, member_number to profiles
alter table profiles
  add column if not exists first_name       text,
  add column if not exists last_name        text,
  add column if not exists membership_class text,
  add column if not exists member_number    bigserial;

-- Backfill first/last name from display_name
update profiles set
  first_name = split_part(display_name, ' ', 1),
  last_name  = nullif(trim(substring(display_name from position(' ' in display_name) + 1)), '');

-- Update trigger to capture first_name / last_name from auth metadata
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$;
