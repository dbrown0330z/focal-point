-- Backfill club_memberships.membership_status and role from profiles
-- for any rows that fell out of sync because setMemberStatus only wrote
-- to profiles and not to club_memberships.

update public.club_memberships cm
set
  membership_status = p.membership_status,
  role              = p.role
from public.profiles p
where cm.user_id = p.id
  and (
    cm.membership_status is distinct from p.membership_status
    or cm.role            is distinct from p.role
  );
