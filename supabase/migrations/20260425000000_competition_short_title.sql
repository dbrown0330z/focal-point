-- Add member-friendly short title to competitions
-- When set, this is used everywhere in the member and judging portals instead of the full title.

alter table public.competitions
  add column if not exists short_title text;
