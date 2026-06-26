<div align="center">

# 🧠 I HAVE A WORD — יש לי מילה

### מצא את המילה ש"על קצה הלשון" — בעזרת AI

תאר מילה במילים שלך, וה-AI (Claude) יחזיר עד **6 מילים מועמדות** מדורגות לפי **אחוז התאמה**, כל אחת עם הגדרה והסבר קצר.

[![Live](https://img.shields.io/badge/▲_Live_Demo-Vercel-black?style=for-the-badge)](https://i-have-a-word.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/noamgabriel246-design/I-have-a-word)

`Vite + React` · `Supabase` · `Claude (Anthropic)` · `Vercel`

**🔗 אתר חי:** <https://i-have-a-word.vercel.app/> &nbsp;·&nbsp; **💻 קוד:** <https://github.com/noamgabriel246-design/I-have-a-word>

</div>

---

<div dir="rtl">

## 📋 סקירה כללית

**I HAVE A WORD** היא אפליקציית ווב שעוזרת למצוא מילה שנמצאת "על קצה הלשון": המשתמש מתאר את המשמעות בשפה חופשית, ומנוע AI מחזיר את המילים הסבירות ביותר — מדורגות באחוזי התאמה, עם הגדרה ונימוק לכל אחת.

## 🎯 הבעיה

כולנו מכירים את התופעה: אתה **יודע בדיוק למה אתה מתכוון** — את המשמעות, ההקשר, התחושה — אבל המילה המדויקת פשוט בורחת. זה נקרא "על קצה הלשון" (*tip of the tongue*), והוא מתסכל במיוחד בזמן כתיבה. הכלים הקיימים לא נבנו לבעיה הזו: מילון דורש שכבר תדע את המילה, ותזאורוס דורש מילת מוצא.

## 👥 קהל היעד

- **כותבים, קופירייטרים ואנשי תוכן** — שצריכים את המילה המדויקת תחת לחץ זמן.
- **סטודנטים ואקדמאים** — לכתיבה מדויקת ועשירה.
- **עולים חדשים ולומדי עברית/אנגלית** — שמכירים את המשמעות אך לא תמיד את המילה.
- **כל דובר עברית או אנגלית** שנתקל ברגע ה"על קצה הלשון".

## 🆚 מתחרים ובידול

| הפתרון הקיים | מה הוא נותן | החיסרון מול I HAVE A WORD |
|---|---|---|
| **מילון רגיל** | מילה ← הגדרה | דורש לדעת את המילה מראש; אין חיפוש הפוך לפי משמעות |
| **תזאורוס** | מילים נרדפות | צריך מילת מוצא; חסר תועלת כשאין שום מילה |
| **חיפוש בגוגל** | תוצאות חופשיות | לא ממוקד, צריך לנפות ידנית; ללא דירוג או שמירה |
| **לשאול ChatGPT ישירות** | תשובת AI כללית | ללא דירוג באחוזים, ללא היסטוריה/שמירה, חוויה לא ממוקדת ולא בעברית |
| **מילון הפוך (OneLook)** | reverse dictionary | מתמקד באנגלית, חלש מאוד בעברית |
| **לשאול חברים / וואטסאפ** | פתרון אנושי | איטי ולא תמיד זמין |

**הבידול שלנו:** ממוקד-עברית, מציג **כמה מועמדות מדורגות באחוזים + נימוק** לכל אחת, עם שמירה והיסטוריה, בחוויה אחת נקייה וייעודית — וחינמי. הסוד (מפתח ה-AI) מוסתר בצד השרת.

## ✨ תכונות עיקריות

- 🔎 **חיפוש מילה ב-AI** — תיאור חופשי ← עד 6 מילים מדורגות + הגדרה + נימוק.
- 🌐 **עברית ואנגלית** — זיהוי שפה אוטומטי מתוך התיאור.
- 💾 **שמירת מילים** והיסטוריית חיפושים אישית.
- 🔐 **התחברות / הרשמה**, "שכחתי סיסמה" ואיפוס סיסמה.
- ⚙️ **הגדרות משתמש** — שינוי סיסמה (עם אימות הסיסמה הנוכחית) ושם תצוגה.
- 📱 **RTL + responsive** — מותאם למובייל ולעברית.

## 🖥️ צילומי מסך

> מומלץ להוסיף 2–3 צילומי מסך (מסך החיפוש, מסך התוצאות, ההגדרות). אפשר לראות את הזרימה החיה באתר: <https://i-have-a-word.vercel.app/>

## 🏗️ ארכיטקטורה

מפתח ה-AI **לעולם אינו מגיע לדפדפן** — הדפדפן קורא ל-Edge Function (`supabase.functions.invoke`), וה-Function (בשרת) קורא ל-Claude עם המפתח הסודי. להלן תרשים הזרימה:

</div>

<div dir="ltr">

```text
[ Browser (React) ]
       |  word description
       v
[ Supabase Edge Function: "find-words" ]   <-- Claude API key hidden here (server-side)
       |  secure request
       v
[ Claude (Anthropic) API ]
       |  JSON: 6 words + match% + reason
       v
[ React renders results ]  +  [ Supabase Postgres: saves history / words ]
```

</div>

<div dir="rtl">

הזרימה: הדפדפן שולח את התיאור ל-Edge Function (בשרת), שמסתיר את מפתח Claude וקורא ל-AI; התוצאה (6 מילים + אחוז + נימוק) חוזרת לתצוגה, והחיפושים נשמרים ב-Supabase.

## 🗄️ מודל הנתונים (ERD)

ה-Backend בנוי על **Supabase / PostgreSQL** עם שלוש טבלאות הקשורות אל `auth.users`, ועם **Row Level Security** על כולן.

</div>

<div dir="ltr">

```mermaid
erDiagram
    users ||--|| profiles : "1:1"
    users ||--o{ searches : "1:N"
    users ||--o{ saved_words : "1:N"
    users { uuid id PK
            text email
            timestamptz created_at }
    profiles { uuid id PK
               text full_name
               text language
               boolean is_premium
               timestamptz created_at }
    searches { uuid id PK
               uuid user_id FK
               text query
               jsonb results
               timestamptz created_at }
    saved_words { uuid id PK
                  uuid user_id FK
                  text word
                  text definition
                  integer match_score
                  timestamptz created_at }
```

</div>

<div dir="rtl">

| טבלה | תיאור | מפתחות |
|---|---|---|
| `profiles` | פרופיל לכל משתמש (שם, שפה, פרימיום) | PK `id` ← `auth.users` (1:1) |
| `searches` | היסטוריית חיפושים | PK `id`, FK `user_id` (N:1) |
| `saved_words` | מילים שמורות | PK `id`, FK `user_id` (N:1) |

**הסכמה המלאה (להרצה ב-Supabase ← SQL Editor):**

</div>

<div dir="ltr">

```sql
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
```

</div>

<div dir="rtl">

## 🔌 שירותים חיצוניים ואינטגרציות

| שירות | סוג | למה משמש |
|---|---|---|
| **Supabase Auth** | אוטנטיקציה | הרשמה, התחברות, איפוס/שינוי סיסמה |
| **Supabase PostgreSQL** | מסד נתונים | פרופילים, חיפושים ומילים שמורות (עם RLS) |
| **Supabase Edge Functions** | לוגיקת שרת | קריאה מאובטחת ל-Claude — **הסתרת מפתח ה-API** |
| **Claude (Anthropic) API** | קריאת API / AI | "המוח": ניתוח התיאור והחזרת מילים מדורגות באחוזים |
| **Vercel** | אירוח / Deployment | פרסום ה-Frontend לאוויר |

## 🔐 אבטחה

- 🔒 **מפתח Claude מוסתר בשרת** — נשמר כ-Secret ב-Supabase (`ANTHROPIC_API_KEY`), לעולם לא בדפדפן או ב-Git.
- **RLS** על כל הטבלאות — כל משתמש ניגש רק לשורות שלו (`auth.uid() = user_id`).
- **הרשאות מינימום** — גישת `anon` מבוטלת; ל-`authenticated` רק הדרוש.
- **Edge Function מוקשח** — אימות והגבלת קלט, הגבלת עלות (`max_tokens`), שגיאות גנריות, CORS, והגנת prompt-injection.
- **שינוי סיסמה** מאמת תחילה את הסיסמה הנוכחית (re-authentication).

## 🧪 בדיקה / משתמש דמו

ההרשמה **פתוחה וחופשית** — כנסו לאתר, הירשמו עם כל אימייל וסיסמה (לפחות 6 תווים), ותתחילו לחפש מיד.

> משתמש דמו לבדיקה מהירה — דוא"ל: `demo@example.com` · סיסמה: `Demo123!`

## 🤖 תיעוד תהליך ה-Vibe Coding

הפרויקט נבנה בליווי כלי AI (Claude) לאורך כל הדרך — מרעיון ועד פריסה לאוויר:

- **ארכיטקטורה ואבטחה:** בתחילה ה-AI נקרא ישירות מהדפדפן, אך זיהיתי (בעזרת ה-AI) שזה חושף את מפתח ה-API בצד הלקוח. עברתי לארכיטקטורה מאובטחת שבה **Supabase Edge Function** מסתירה את המפתח בשרת — בדיוק כפי שנדרש.
- **בניית ה-Backend:** עיצבתי סכמת מסד נתונים עם שלוש טבלאות ו-RLS, כתבתי את ה-Edge Function שקוראת ל-Claude, והגדרתי הרשאות מינימום.
- **פתרון תקלות (debugging):** נתקלתי בתקלות אמיתיות ופתרתי אותן צעד-אחר-צעד — שגיאת `temperature is deprecated` במודלים החדשים של Claude, בעיית **CORS / Verify JWT** בין הדפדפן ל-Edge Function, ובעיית "מצב דמו" כשמשתני הסביבה לא נטענו ב-Vercel (נדרש Redeploy).
- **שיפור חוויית השגיאות:** במקום הודעה כללית, האפליקציה מציגה את הסיבה המדויקת (מפתח חסר / אין קרדיט / 401) שמכוונת ישירות לפתרון.

מעבר לכתיבת קוד, התהליך לימד אותי לשקול **tradeoffs** (אבטחה מול פשטות), לקרוא **לוגים** של השרת, ולאבחן תקלות בצורה שיטתית — מהתסמין, דרך הלוג, ועד התיקון.

## 🚀 הרצה מקומית

</div>

<div dir="ltr">

```bash
git clone https://github.com/noamgabriel246-design/I-have-a-word.git
cd I-have-a-word
npm install
npm run dev      # http://localhost:5173
```

</div>

<div dir="rtl">

נדרשים משתני סביבה (ראו למטה). **פריסה ל-Vercel:** ייבוא הריפו ← הגדרת משתני הסביבה ← Deploy.

## ⚙️ משתני סביבה וסודות

**ב-Vercel** (Settings ← Environment Variables) — צד לקוח:

| שם | ערך |
|---|---|
| `VITE_SUPABASE_URL` | Project URL מ-Supabase |
| `VITE_SUPABASE_ANON_KEY` | Publishable key (או anon) מ-Supabase |

**ב-Supabase** (Edge Functions ← Secrets) — צד שרת (מוסתר):

| שם | ערך |
|---|---|
| `ANTHROPIC_API_KEY` | מפתח Claude (`sk-ant-...`) |
| `ANTHROPIC_MODEL` | אופציונלי — למשל `claude-sonnet-4-6` |

## 🧱 טכנולוגיות

Vite · React · React Router · Supabase (Auth + Postgres + Edge Functions) · Claude (Anthropic) · Vercel · CSS (RTL, logical properties).

## 📁 מבנה הפרויקט

</div>

<div dir="ltr">

```text
App.jsx                                   UI: routing, auth context, components, pages
main.jsx                                  entry point
index.css                                 design system (RTL)
data.js                                   constants (search examples)
supabaseClient.js                         Supabase connection
support.js                                logic: Edge Function call + DB + account
index.html  ·  vite.config.js  ·  package.json
supabase/schema.sql                       database schema (incl. RLS)
supabase/functions/find-words/index.ts    the Edge Function (Claude) - key hidden server-side
```

</div>

<div align="center">

---

נבנה כפרויקט גמר · קורס פיתוח מוצר מבוסס AI · המכללה האקדמית אונו 🧠

</div>
