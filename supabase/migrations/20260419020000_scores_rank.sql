-- Add a within-score-group rank field to scores.
-- Judges use this to express a preferred ordering among images that share
-- the same numeric score (e.g. four images all scored 27).
-- Null means no preference expressed; 1 = most preferred within the group.
alter table scores add column rank smallint;
