-- Update the saved homepage_blocks to set upcoming-events count to 4.
-- The DEFAULT_BLOCKS constant was previously 5; mergeBlocks preserves saved
-- values, so existing clubs retain the old count unless we patch it here.

UPDATE club_settings
SET homepage_blocks = (
  SELECT jsonb_agg(
    CASE
      WHEN block->>'id' = 'upcoming-events'
        AND (block->'eventsSettings'->>'count')::int > 4
      THEN jsonb_set(block, '{eventsSettings,count}', '4')
      ELSE block
    END
  )
  FROM jsonb_array_elements(homepage_blocks) AS block
)
WHERE homepage_blocks IS NOT NULL
  AND homepage_blocks @> '[{"id":"upcoming-events"}]';
