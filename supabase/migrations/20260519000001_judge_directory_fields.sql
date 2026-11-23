-- Add first_name, last_name, phone, website to judge_directory
-- Existing rows get first_name populated from the current name field

alter table public.judge_directory
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists phone      text,
  add column if not exists website    text;

-- Back-fill: treat existing single-word names as first_name,
-- multi-word as first word = first_name, rest = last_name
update public.judge_directory
set
  first_name = case
    when position(' ' in name) > 0 then split_part(name, ' ', 1)
    else name
  end,
  last_name = case
    when position(' ' in name) > 0
    then trim(substring(name from position(' ' in name) + 1))
    else null
  end
where first_name is null;
