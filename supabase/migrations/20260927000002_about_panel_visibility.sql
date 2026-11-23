-- Per-field visibility toggles for the About page side panel.
-- Buttons default on; detail rows default off (admin enables what they want to show).

ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS panel_show_founded_year  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS panel_show_member_count  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS panel_show_schedule      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS panel_show_location      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS panel_show_instagram     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS panel_show_facebook      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS panel_show_join_button   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS panel_show_contact       boolean NOT NULL DEFAULT true;
