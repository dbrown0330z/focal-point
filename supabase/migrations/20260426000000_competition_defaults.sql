-- Competition-level defaults (single row — same singleton pattern as club_settings)
-- These values pre-populate every new competition created via the wizard.

create table public.competition_defaults (
  id                             uuid        primary key default gen_random_uuid(),

  -- Entries & submissions
  max_entries_per_member         int         not null default 4,
  max_entries_per_category       int,                            -- null = no per-category limit
  image_long_edge_preset         text        not null default '1920',
  image_long_edge_custom         int,
  require_capture_date           boolean     not null default false,
  capture_date_amount            int         not null default 2,
  capture_date_unit              text        not null default 'years',
  image_reuse_rule               text        not null default 'once-per-type',
  withdrawal_frees_slot          boolean     not null default true,

  -- Scoring
  judging_method                 text        not null default 'simple-scored',
  score_min                      int         not null default 1,
  score_max                      int         not null default 30,
  allow_decimals                 boolean     not null default false,
  score_aggregation              text        not null default 'sum',

  -- Judge experience
  hide_member_names              boolean     not null default true,
  hide_exif_data                 boolean     not null default false,
  require_judge_comments         boolean     not null default false,
  judge_comments_min_chars       int         not null default 20,

  -- Results
  score_min_to_publish_enabled   boolean     not null default false,
  score_min_to_publish           int         not null default 10,
  results_visibility             text        not null default 'members-only',
  results_visibility_delay_hours int         not null default 24,

  updated_at                     timestamptz not null default now()
);

-- Seed the single row so the page always has something to update into
insert into public.competition_defaults default values;

-- Enforce single row
create unique index competition_defaults_singleton on public.competition_defaults ((true));

-- RLS: same pattern as club_settings
alter table public.competition_defaults enable row level security;

create policy "admins manage competition defaults"
  on public.competition_defaults for all to authenticated
  using   (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "members read competition defaults"
  on public.competition_defaults for select to authenticated using (true);
