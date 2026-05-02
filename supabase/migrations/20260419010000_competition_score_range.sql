-- Add configurable score range to competitions.
-- Previously the scores table had a hardcoded check (score between 1 and 10)
-- which blocks clubs using wider ranges (e.g. 1–30). Score range is now a
-- competition-level setting and validated in the application layer.

-- Remove the hardcoded constraint
alter table scores drop constraint if exists scores_score_check;

-- Add score range to competitions (default 1–10 preserves existing behaviour)
alter table competitions
  add column score_min integer not null default 1,
  add column score_max integer not null default 10;

-- Soft application-level guard: score must be a positive integer within a
-- reasonable ceiling. Hard per-competition bounds are enforced in app code.
alter table scores
  add constraint scores_score_positive check (score >= 1 and score <= 100);
