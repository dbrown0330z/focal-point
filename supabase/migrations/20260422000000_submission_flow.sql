-- ─── Submission flow — new competition-level settings ─────────────────────────
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS require_capture_date        boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS capture_date_window_months  integer,          -- null = no restriction
  ADD COLUMN IF NOT EXISTS image_reuse_rule            text     NOT NULL DEFAULT 'unrestricted'
    CHECK (image_reuse_rule IN ('unrestricted','once_per_type','once_per_season','once_ever')),
  ADD COLUMN IF NOT EXISTS withdrawal_frees_slot       boolean  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_entries_per_category    integer,          -- null = no per-cat limit
  ADD COLUMN IF NOT EXISTS allow_notes_to_judge        boolean  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_long_edge               integer  NOT NULL DEFAULT 1920;

-- ─── Image metadata for dupe detection ────────────────────────────────────────
ALTER TABLE images
  ADD COLUMN IF NOT EXISTS exif_unique_id  text,
  ADD COLUMN IF NOT EXISTS p_hash          text,
  ADD COLUMN IF NOT EXISTS p_hash_status   text NOT NULL DEFAULT 'pending'
    CHECK (p_hash_status IN ('pending','complete','failed')),
  ADD COLUMN IF NOT EXISTS file_size       integer,   -- bytes
  ADD COLUMN IF NOT EXISTS width_px        integer,
  ADD COLUMN IF NOT EXISTS height_px       integer;

-- ─── Submission metadata ──────────────────────────────────────────────────────
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS notes                       text,
  ADD COLUMN IF NOT EXISTS duplicate_warning_shown     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_warning_override  boolean NOT NULL DEFAULT false;
