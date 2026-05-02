-- Add from_email to club_settings
--
-- from_email is the address used in the From: header when the club sends
-- bulk notifications and judge invitations via Resend.
-- Distinct from contact_email, which is the public-facing reply-to address
-- shown in membership terms and on the public site.

alter table public.club_settings
  add column if not exists from_email text;
