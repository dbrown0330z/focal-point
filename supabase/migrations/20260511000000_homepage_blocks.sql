-- Add homepage_blocks JSONB column to club_settings.
-- Stores the ordered, configured block list from the admin Homepage editor.
-- NULL means "use defaults" — the app falls back to DEFAULT_BLOCKS when this is null.

alter table public.club_settings
  add column if not exists homepage_blocks jsonb;

comment on column public.club_settings.homepage_blocks is
  'Ordered array of ContentBlock objects that drive the member homepage layout.
   NULL → app falls back to DEFAULT_BLOCKS. Set by the admin Homepage editor.';
