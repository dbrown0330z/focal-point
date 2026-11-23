-- Judging portal spec fields

-- Competition configuration for judging
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS judge_instructions  text,
  ADD COLUMN IF NOT EXISTS preset              text not null default 'simple_scored',
  ADD COLUMN IF NOT EXISTS allow_half_points   boolean not null default false,
  ADD COLUMN IF NOT EXISTS anonymise_members   boolean not null default false,
  ADD COLUMN IF NOT EXISTS anonymise_exif      boolean not null default false,
  ADD COLUMN IF NOT EXISTS require_feedback    boolean not null default false;

-- Flag for review on individual scores
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS flagged boolean not null default false;

-- Track when a judge submits their scores (locks them)
ALTER TABLE judge_tokens
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
