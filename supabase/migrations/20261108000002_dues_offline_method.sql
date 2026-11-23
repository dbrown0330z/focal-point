-- ─────────────────────────────────────────────────────────────────────────────
-- Dues offline payment method details
--
-- Extends club_settings with the specific offline payment sub-type and
-- the extra fields needed when members mail a cheque.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS dues_offline_method      text CHECK (dues_offline_method IN ('cheque','digital-transfer','cash')),
  ADD COLUMN IF NOT EXISTS dues_cheque_payable_to   text,
  ADD COLUMN IF NOT EXISTS dues_cheque_mail_to      text;
