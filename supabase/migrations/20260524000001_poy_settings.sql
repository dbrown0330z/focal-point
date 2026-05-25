-- Add POY scoring configuration columns to club_settings.
-- All columns default to the "classic" mode so existing clubs are unaffected.

ALTER TABLE club_settings
  ADD COLUMN IF NOT EXISTS poy_categories_factor     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS poy_separate_per_category boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS poy_branch_a_counting     text    DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS poy_branch_a_top_n        integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS poy_branch_a_exclude_n    integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS poy_b1_counting           text    DEFAULT 'top_n',
  ADD COLUMN IF NOT EXISTS poy_b1_top_n              integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS poy_b1_exclude_n          integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS poy_b2_counting           text    DEFAULT 'top_n',
  ADD COLUMN IF NOT EXISTS poy_b2_top_n              integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS poy_b2_exclude_n          integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS poy_tiebreaker            text    DEFAULT 'next_highest',
  ADD COLUMN IF NOT EXISTS poy_eligibility           text    DEFAULT 'active_members',
  ADD COLUMN IF NOT EXISTS poy_eligibility_min_dur   text    DEFAULT '6_months';
