ALTER TABLE club_settings
  ADD COLUMN IF NOT EXISTS approval_mode                text    NOT NULL DEFAULT 'admin_approval',
  ADD COLUMN IF NOT EXISTS notify_new_application       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_member_activates      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_payment_link_expires  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_membership_expires    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_all_admins            boolean NOT NULL DEFAULT true;
