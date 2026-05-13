alter table public.users
  add column if not exists birth_date date,
  add column if not exists country_of_study text,
  add column if not exists school_name text,
  add column if not exists grade_level text;
