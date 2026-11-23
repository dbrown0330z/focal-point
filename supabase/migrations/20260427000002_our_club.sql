-- ─────────────────────────────────────────────────────────
-- Our Club feature
--   • about_page_content  – rich-text blocks for the About page
--   • document_categories – ordered list of category labels
--   • documents           – uploaded club documents
--   • club_settings tweak – member_directory_visibility flag
-- ─────────────────────────────────────────────────────────

-- ── 1. about_page_content ────────────────────────────────
create table if not exists public.about_page_content (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  section_key  text    not null,          -- e.g. 'intro', 'history', 'meet_the_team'
  heading      text,
  body         text,                      -- plain text / markdown stored as text
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id) on delete set null
);

-- Only one row per section_key
create unique index if not exists about_page_content_key_idx
  on public.about_page_content (section_key);

-- RLS: public read, admin write
alter table public.about_page_content enable row level security;

drop policy if exists "about_page_content: public read" on public.about_page_content;
create policy "about_page_content: public read"
  on public.about_page_content for select
  using (true);

drop policy if exists "about_page_content: admin write" on public.about_page_content;
create policy "about_page_content: admin write"
  on public.about_page_content for all
  using (is_admin())
  with check (is_admin());

-- ── 2. document_categories ───────────────────────────────
create table if not exists public.document_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text    not null,
  sort_order integer not null default 0
);

alter table public.document_categories enable row level security;

drop policy if exists "document_categories: member read" on public.document_categories;
create policy "document_categories: member read"
  on public.document_categories for select
  using (is_approved_member() or is_admin());

drop policy if exists "document_categories: admin write" on public.document_categories;
create policy "document_categories: admin write"
  on public.document_categories for all
  using (is_admin())
  with check (is_admin());

-- ── 3. documents ─────────────────────────────────────────
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  category_id uuid references public.document_categories(id) on delete set null,
  file_path   text        not null,   -- Supabase Storage object path
  file_name   text        not null,   -- original filename for display
  file_size   bigint,                 -- bytes
  mime_type   text,
  visibility  text        not null default 'members'
                check (visibility in ('members', 'public')),
  sort_order  integer     not null default 0,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  deleted_at  timestamptz
);

alter table public.documents enable row level security;

-- Members can read non-deleted documents
drop policy if exists "documents: member read" on public.documents;
create policy "documents: member read"
  on public.documents for select
  using (
    deleted_at is null
    and (
      (visibility = 'members' and (is_approved_member() or is_admin()))
      or (visibility = 'public')
    )
  );

drop policy if exists "documents: admin write" on public.documents;
create policy "documents: admin write"
  on public.documents for all
  using (is_admin())
  with check (is_admin());

-- ── 4. Storage bucket for documents ──────────────────────
-- Creates the 'documents' bucket (private, signed URLs)
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Members can download from the documents bucket
drop policy if exists "documents bucket: member read" on storage.objects;
create policy "documents bucket: member read"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (
      is_approved_member()
      or is_admin()
    )
  );

-- Admins can upload/delete documents
drop policy if exists "documents bucket: admin write" on storage.objects;
create policy "documents bucket: admin write"
  on storage.objects for insert
  with check (bucket_id = 'documents' and is_admin());

drop policy if exists "documents bucket: admin delete" on storage.objects;
create policy "documents bucket: admin delete"
  on storage.objects for delete
  using (bucket_id = 'documents' and is_admin());

drop policy if exists "documents bucket: admin update" on storage.objects;
create policy "documents bucket: admin update"
  on storage.objects for update
  using (bucket_id = 'documents' and is_admin())
  with check (bucket_id = 'documents' and is_admin());

-- ── 5. club_settings: member directory visibility ────────
alter table public.club_settings
  add column if not exists member_directory_visibility text not null default 'members'
  check (member_directory_visibility in ('members', 'admin_only'));

-- ── 6. Seed defaults ─────────────────────────────────────
-- About page: default sections
insert into public.about_page_content (section_key, sort_order, heading, body)
values
  ('intro',   1, 'About our club',        'Welcome to our camera club. We are a community of passionate photographers who come together to learn, share, and grow.'),
  ('history', 2, 'Our history',           null),
  ('join',    3, 'How to join',           'Membership is open to anyone with an interest in photography. Fill out an application and a club admin will approve your membership.')
on conflict (section_key) do nothing;

-- Default document categories
insert into public.document_categories (name, sort_order)
values
  ('Constitution & Rules',  1),
  ('Competition Guidelines', 2),
  ('Meeting Minutes',        3),
  ('Forms',                  4),
  ('Other',                  5)
on conflict do nothing;
