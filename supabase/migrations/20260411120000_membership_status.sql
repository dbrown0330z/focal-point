-- Add membership_status enum and column

create type membership_status as enum ('pending', 'approved', 'active', 'expired');

alter table profiles
  add column membership_status membership_status not null default 'pending';

-- Existing members with a role are already active
update profiles set membership_status = 'active' where role is not null;

-- Update is_approved_member to also require active status
create or replace function is_approved_member()
returns boolean
language sql
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role is not null
      and membership_status = 'active'
  )
$$;
