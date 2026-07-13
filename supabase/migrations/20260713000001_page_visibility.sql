-- Add page_visibility JSONB to club_settings.
-- Stores visibility overrides for built-in pages that are configurable.
-- Currently supports: 'about' and 'calendar'.
-- Values: 'members_only' | 'public'
-- Default is members_only for both (no change to existing behaviour).

alter table public.club_settings
  add column if not exists page_visibility jsonb default '{}'::jsonb;

comment on column public.club_settings.page_visibility is
  'Visibility overrides for configurable built-in pages. Keys: about, calendar. Values: members_only | public.';
