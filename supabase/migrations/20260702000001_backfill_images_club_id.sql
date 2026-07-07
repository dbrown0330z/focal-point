-- Backfill club_id on images that were uploaded via the modal before the fix.
-- Uses club_memberships to resolve owner → club. If a user belongs to exactly
-- one club (the common case for an MVP), this is unambiguous.
UPDATE public.images i
SET club_id = cm.club_id
FROM public.club_memberships cm
WHERE i.owner_id = cm.user_id
  AND i.club_id IS NULL;
