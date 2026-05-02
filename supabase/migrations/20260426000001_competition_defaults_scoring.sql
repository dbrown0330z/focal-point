-- Update competition_defaults scoring values to 1–10 with half-points enabled
update public.competition_defaults
set
  score_max      = 10,
  allow_decimals = true;
