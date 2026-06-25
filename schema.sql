-- ============================================================================
--  I HAVE A WORD  —  סכימת מסד הנתונים (Supabase / PostgreSQL)
--  גרסה מוקשחת אבטחתית (security-hardened)
-- ----------------------------------------------------------------------------
--  איך מריצים:
--  1. Supabase -> הפרויקט שלך -> תפריט שמאלי -> "SQL Editor".
--  2. "New query", הדבק את כל הקובץ, ולחץ "Run".
--
--  עקרונות אבטחה כאן:
--   - RLS (Row Level Security) על כל טבלה: כל משתמש רואה/עורך רק את שלו.
--   - הרשאות מינימום (least privilege): גישת anon (לא-מחובר) מבוטלת לחלוטין
--     לטבלאות הנתונים; ל-authenticated רק ההרשאות שהאפליקציה צריכה.
--   - אילוצי CHECK על אורך/טווח שדות (הגנה מפני נתונים חריגים/שימוש לרעה).
--
--  בטוח להרצה חוזרת.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1) profiles — פרופיל אחד לכל משתמש (נוצר אוטומטית בהרשמה, ראה טריגר למטה)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  full_name   text        check (full_name is null or char_length(full_name) <= 120),
  language    text        not null default 'he' check (language in ('he','en')),
  is_premium  boolean     not null default false,
  created_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 2) searches — היסטוריית חיפושים + התוצאות שה-AI החזיר
-- ---------------------------------------------------------------------------
create table if not exists public.searches (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  query       text        not null check (char_length(query) between 1 and 1000),
  results     jsonb       not null default '[]',
  created_at  timestamptz not null default now()
);
create index if not exists searches_user_id_created_idx
  on public.searches (user_id, created_at desc);


-- ---------------------------------------------------------------------------
-- 3) saved_words — מילים שהמשתמש שמר
-- ---------------------------------------------------------------------------
create table if not exists public.saved_words (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  word         text        not null check (char_length(word) between 1 and 200),
  definition   text        check (definition is null or char_length(definition) <= 1000),
  match_score  integer     check (match_score is null or (match_score between 0 and 100)),
  created_at   timestamptz not null default now()
);
create index if not exists saved_words_user_id_created_idx
  on public.saved_words (user_id, created_at desc);


-- ============================================================================
--  אבטחה: Row Level Security (RLS)
-- ============================================================================
alter table public.profiles    enable row level security;
alter table public.searches    enable row level security;
alter table public.saved_words enable row level security;

-- ---- profiles ----
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ---- searches ----
drop policy if exists "searches_select_own" on public.searches;
create policy "searches_select_own" on public.searches
  for select using (auth.uid() = user_id);

drop policy if exists "searches_insert_own" on public.searches;
create policy "searches_insert_own" on public.searches
  for insert with check (auth.uid() = user_id);

drop policy if exists "searches_delete_own" on public.searches;
create policy "searches_delete_own" on public.searches
  for delete using (auth.uid() = user_id);

-- ---- saved_words ----
drop policy if exists "saved_words_select_own" on public.saved_words;
create policy "saved_words_select_own" on public.saved_words
  for select using (auth.uid() = user_id);

drop policy if exists "saved_words_insert_own" on public.saved_words;
create policy "saved_words_insert_own" on public.saved_words
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_words_delete_own" on public.saved_words;
create policy "saved_words_delete_own" on public.saved_words
  for delete using (auth.uid() = user_id);


-- ============================================================================
--  הרשאות מינימום (Least Privilege)
--  מבטלים כל גישה למשתמש לא-מחובר (anon), ונותנים ל-authenticated רק את
--  פעולות ה-DML שהאפליקציה באמת מבצעת. ה-RLS עדיין מסנן שורות לפי משתמש.
-- ============================================================================
revoke all on public.profiles    from anon;
revoke all on public.searches    from anon;
revoke all on public.saved_words from anon;

grant select, insert, update on public.profiles    to authenticated;
grant select, insert, delete on public.searches    to authenticated;
grant select, insert, delete on public.saved_words to authenticated;


-- ============================================================================
--  טריגר: יצירת פרופיל אוטומטית בכל הרשמה
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  הערת ייצור (production):
--   • הפעל אישור דוא"ל: Authentication -> Providers -> Email -> "Confirm email".
--   • שקול הגבלת קצב/מכסה יומית לחיפושים (ראה SECURITY.md).
-- ============================================================================
