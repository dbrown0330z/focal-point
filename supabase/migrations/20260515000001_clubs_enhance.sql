-- ─────────────────────────────────────────────────────────────────────────────
-- Enhance clubs table for multi-tenant SaaS
--
-- Adds lifecycle status, plan tier, contact info, and the FP super-admin flag.
-- The default/dev club is set to active so existing development work continues.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. clubs: add SaaS lifecycle fields ──────────────────────────────────────

alter table public.clubs
  add column if not exists status        text        not null default 'pending'
      check (status in ('pending', 'active', 'suspended')),
  add column if not exists plan          text        not null default 'starter',
  add column if not exists contact_email text,
  add column if not exists approved_at   timestamptz,
  add column if not exists approved_by   uuid references auth.users(id) on delete set null;

-- The seeded default club is active (development / first club)
update public.clubs
set status = 'active'
where slug = 'default';

-- ── 2. profiles: Focal Point super-admin flag ─────────────────────────────────
-- Distinct from club admin role. is_fp_admin = true grants access to
-- /super-admin and lets the holder manage any club.

alter table public.profiles
  add column if not exists is_fp_admin boolean not null default false;
