-- Add 4-digit access code to judge_tokens for secure PIN verification
-- Judges receive this code separately (e.g. via email) alongside their magic link.
alter table judge_tokens
  add column access_code text not null default lpad(floor(random() * 10000)::text, 4, '0');
