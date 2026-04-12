-- ============================================================
-- Enums
-- ============================================================

create type user_role as enum ('admin', 'member');
create type competition_status as enum ('draft', 'open', 'judging', 'closed');
create type submission_status as enum ('submitted', 'withdrawn');


-- ============================================================
-- profiles
-- Extends auth.users. role = null means pending admin approval.
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role,
  display_name  text not null,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row on signup
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ============================================================
-- images
-- ============================================================

create table images (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);


-- ============================================================
-- competitions
-- ============================================================

create table competitions (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  status            competition_status not null default 'draft',
  submission_limit  int not null default 3,
  opens_at          timestamptz,
  closes_at         timestamptz,
  created_at        timestamptz not null default now()
);


-- ============================================================
-- competition_categories
-- ============================================================

create table competition_categories (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions(id) on delete cascade,
  name            text not null
);


-- ============================================================
-- submissions
-- Soft uniqueness: an image can only be in one active submission.
-- ============================================================

create table submissions (
  id              uuid primary key default gen_random_uuid(),
  image_id        uuid not null references images(id) on delete restrict,
  competition_id  uuid not null references competitions(id) on delete restrict,
  category_id     uuid not null references competition_categories(id) on delete restrict,
  member_id       uuid not null references profiles(id) on delete restrict,
  status          submission_status not null default 'submitted',
  submitted_at    timestamptz not null default now()
);

-- Enforces the one-active-submission-per-image rule
create unique index submissions_image_active_unique
  on submissions(image_id)
  where status = 'submitted';


-- ============================================================
-- judge_tokens
-- No account required — judges access via magic link /judge/[token]
-- ============================================================

create table judge_tokens (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions(id) on delete cascade,
  judge_name      text not null,
  judge_email     text not null,
  token           uuid not null unique default gen_random_uuid(),
  created_at      timestamptz not null default now()
);


-- ============================================================
-- scores
-- ============================================================

create table scores (
  id               uuid primary key default gen_random_uuid(),
  submission_id    uuid not null references submissions(id) on delete cascade,
  judge_token_id   uuid not null references judge_tokens(id) on delete cascade,
  score            smallint not null check (score between 1 and 10),
  notes            text,
  created_at       timestamptz not null default now(),
  unique (submission_id, judge_token_id)
);


-- ============================================================
-- posts
-- Admin-authored news shown on the member homepage
-- ============================================================

create table posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references profiles(id) on delete restrict,
  title         text not null,
  body          text not null,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);


-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles               enable row level security;
alter table images                 enable row level security;
alter table competitions           enable row level security;
alter table competition_categories enable row level security;
alter table submissions            enable row level security;
alter table judge_tokens           enable row level security;
alter table scores                 enable row level security;
alter table posts                  enable row level security;

-- Helper: is the current user an admin?
create function is_admin()
returns boolean
language sql
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- Helper: does the current user have an approved role?
create function is_approved_member()
returns boolean
language sql
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role is not null
  )
$$;

-- profiles
create policy "Users can read own profile"
  on profiles for select using (id = auth.uid());
create policy "Admins can read all profiles"
  on profiles for select using (is_admin());
create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());
create policy "Admins can update any profile"
  on profiles for update using (is_admin());

-- images
create policy "Members can manage own images"
  on images for all using (owner_id = auth.uid());
create policy "Admins can read all images"
  on images for select using (is_admin());

-- competitions
create policy "Approved members can read non-draft competitions"
  on competitions for select using (
    is_approved_member() and status != 'draft'
  );
create policy "Admins can manage competitions"
  on competitions for all using (is_admin());

-- competition_categories
create policy "Approved members can read categories"
  on competition_categories for select using (is_approved_member());
create policy "Admins can manage categories"
  on competition_categories for all using (is_admin());

-- submissions
create policy "Members can manage own submissions"
  on submissions for all using (member_id = auth.uid());
create policy "Admins can read all submissions"
  on submissions for select using (is_admin());

-- judge_tokens: lookup by token must work without a session (server-side validation)
create policy "Public can read judge tokens"
  on judge_tokens for select using (true);
create policy "Admins can manage judge tokens"
  on judge_tokens for all using (is_admin());

-- scores: judges write via service role server action; members read own after close
create policy "Members can read own scores after competition closes"
  on scores for select using (
    exists (
      select 1 from submissions s
      join competitions c on c.id = s.competition_id
      where s.id = scores.submission_id
        and s.member_id = auth.uid()
        and c.status = 'closed'
    )
  );
create policy "Admins can read all scores"
  on scores for select using (is_admin());

-- posts
create policy "Approved members can read published posts"
  on posts for select using (
    is_approved_member() and published_at is not null and published_at <= now()
  );
create policy "Admins can manage posts"
  on posts for all using (is_admin());
