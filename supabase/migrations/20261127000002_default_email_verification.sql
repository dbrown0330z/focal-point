-- Correct the default enrollment mode: email verification, not admin approval.
-- Any club that still has admin_approval set gets reset to email_verification.
UPDATE club_settings
SET approval_mode = 'email_verification'
WHERE approval_mode = 'admin_approval';
