-- Score aggregation method for multi-judge competitions
-- 'sum'      — all judges' scores are added together
-- 'average'  — mean of all judges' scores
-- 'drop_extremes' — drop the highest and lowest score, average the rest
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS score_aggregation text NOT NULL DEFAULT 'average'
    CHECK (score_aggregation IN ('sum', 'average', 'drop_extremes'));

-- Whether judges can see each other's scores while judging is in progress
-- When true, scores from other judges are hidden until the window closes
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS blind_judging boolean NOT NULL DEFAULT false;
