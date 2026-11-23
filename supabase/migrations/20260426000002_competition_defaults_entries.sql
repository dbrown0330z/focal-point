-- Update competition_defaults entry limits
update public.competition_defaults
set
  max_entries_per_member   = 3,
  max_entries_per_category = 1;
