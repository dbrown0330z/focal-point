-- Add club profile fields used on the About Our Club page.

ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS annual_dues        text,
  ADD COLUMN IF NOT EXISTS join_fee           text,
  ADD COLUMN IF NOT EXISTS meeting_schedule   text,
  ADD COLUMN IF NOT EXISTS meeting_notes      text,
  ADD COLUMN IF NOT EXISTS founded_year       integer,
  ADD COLUMN IF NOT EXISTS member_count_approx integer,
  ADD COLUMN IF NOT EXISTS website_url        text,
  ADD COLUMN IF NOT EXISTS facebook_url       text,
  ADD COLUMN IF NOT EXISTS instagram_url      text,
  ADD COLUMN IF NOT EXISTS join_open          boolean NOT NULL DEFAULT true;
