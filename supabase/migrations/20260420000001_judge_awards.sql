-- Awards feature: add award tracking to competitions, scores, and a new pass-completion table

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS awards_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS award_types    jsonb   NOT NULL DEFAULT '[]';

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS award_id text;

CREATE TABLE IF NOT EXISTS judge_category_awards (
  judge_token_id uuid        NOT NULL REFERENCES judge_tokens(id)             ON DELETE CASCADE,
  category_id    uuid        NOT NULL REFERENCES competition_categories(id)   ON DELETE CASCADE,
  completed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (judge_token_id, category_id)
);
