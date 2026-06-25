// support.js — שכבת הלוגיקה (ללא רכיבי UI).
// • AI: דרך Supabase Edge Function "find-words" — מפתח Claude מוסתר בשרת (מאובטח).
// • מסד נתונים + חשבון: Supabase אמיתי בלבד (אין מצב דמו).

import { supabase } from './supabaseClient'

/* ======================================================================== *
 *  AI — קריאה ל-Edge Function "find-words"
 *  הדפדפן שולח את התיאור ל-Edge Function שרץ בשרת Supabase; הפונקציה פונה
 *  ל-Claude עם המפתח הסודי (שלא חשוף ללקוח) ומחזירה עד 6 מילים:
 *  [{ word, definition, match, reason }].
 * ======================================================================== */
function clampScore(v) {
  let n = Math.round(Number(v))
  if (!Number.isFinite(n)) n = 70
  return Math.max(0, Math.min(100, n))
}

export async function findWords(query) {
  const { data, error } = await supabase.functions.invoke('find-words', {
    body: { query },
  })

  if (error) {
    // נסה לחלץ את השגיאה האמיתית שהפונקציה החזירה (קוד + סטטוס HTTP)
    let status = 0
    let code = ''
    const ctx = error.context
    if (ctx) {
      status = ctx.status || 0
      try {
        const body = await ctx.clone().json()
        code = body?.error || ''
      } catch { /* גוף לא-JSON */ }
    }
    if (status === 401 || status === 403) throw new Error('AI_AUTH:' + status)
    if (code === 'not_configured') throw new Error('AI_NOT_CONFIGURED')
    if (code === 'ai_unavailable') throw new Error('AI_UNAVAILABLE')
    throw new Error('AI_REQUEST_FAILED:' + (status || '?') + (code ? ' ' + code : ' ' + (error.message || '')))
  }

  // אם הוחזר 200 אך עם שגיאה בגוף
  if (data?.error) {
    if (data.error === 'not_configured') throw new Error('AI_NOT_CONFIGURED')
    if (data.error === 'ai_unavailable') throw new Error('AI_UNAVAILABLE')
    throw new Error('AI_REQUEST_FAILED:' + data.error)
  }

  const words = Array.isArray(data?.words) ? data.words : []
  if (!words.length) throw new Error('AI_EMPTY')

  return words
    .slice(0, 6)
    .map((w) => ({
      word: String(w.word ?? '').trim(),
      definition: String(w.definition ?? '').trim(),
      match: clampScore(w.match),
      reason: String(w.reason ?? '').trim(),
    }))
    .filter((w) => w.word)
}

/* ======================================================================== *
 *  חשבון / Auth (Supabase)
 * ======================================================================== */
export async function signUpUser(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || '' } },
  })
  if (error) throw error
  return { data }
}

export async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { data }
}

export async function signOutUser() {
  await supabase.auth.signOut()
}

export async function resetPasswordEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  })
  if (error) throw error
}

// אימות הסיסמה הנוכחית לפני שינוי (אבטחה: לוודא שזה באמת המשתמש)
export async function verifyCurrentPassword(email, currentPassword) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (error) throw new Error('CURRENT_PASSWORD_WRONG')
  return true
}

export async function updateUserPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function updateDisplayName(fullName) {
  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
  if (error) throw error
}

/* ======================================================================== *
 *  היסטוריית חיפושים (Supabase)
 * ======================================================================== */
export async function saveSearch(userId, query, results) {
  const { data, error } = await supabase
    .from('searches')
    .insert({ user_id: userId, query, results })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getSearches() {
  const { data, error } = await supabase
    .from('searches')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteSearch(id) {
  const { error } = await supabase.from('searches').delete().eq('id', id)
  if (error) throw error
}

/* ======================================================================== *
 *  מילים שמורות (Supabase)
 * ======================================================================== */
export async function saveWord(userId, wordObj) {
  const { data, error } = await supabase
    .from('saved_words')
    .insert({
      user_id: userId,
      word: wordObj.word,
      definition: wordObj.definition,
      match_score: wordObj.match,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getSavedWords() {
  const { data, error } = await supabase
    .from('saved_words')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function removeSavedWord(id) {
  const { error } = await supabase.from('saved_words').delete().eq('id', id)
  if (error) throw error
}

/* ======================================================================== *
 *  תרגום שגיאות להודעות ידידותיות בעברית
 * ======================================================================== */
export function translateAuthError(msg = '') {
  if (msg.includes('AI_AUTH'))
    return 'ה-Edge Function דחתה את הבקשה (401). פתרון: ב-Supabase → Edge Functions → find-words → Settings → כבה "Verify JWT".'
  if (msg.includes('AI_NOT_CONFIGURED'))
    return 'הסוד ANTHROPIC_API_KEY לא מוגדר ב-Supabase (Edge Functions → Secrets). הוסף אותו ונסה שוב.'
  if (msg.includes('AI_UNAVAILABLE'))
    return 'Claude לא הגיב. כנראה מפתח לא תקין, אין קרדיט, או שם מודל שגוי (ANTHROPIC_MODEL). בדוק בלוגים של הפונקציה.'
  if (msg.includes('AI_REQUEST_FAILED'))
    return 'הקריאה ל-AI נכשלה. בדוק בלוגים של ה-Edge Function (find-words → Logs) מה הסיבה המדויקת.'
  if (msg.includes('AI_EMPTY'))
    return 'ה-AI לא החזיר תוצאות. נסה לנסח את התיאור אחרת.'
  if (msg.includes('CURRENT_PASSWORD_WRONG')) return 'הסיסמה הנוכחית שגויה.'
  if (msg.includes('Invalid login credentials')) return 'אימייל או סיסמה שגויים.'
  if (msg.includes('Email not confirmed')) return 'יש לאמת את כתובת האימייל לפני ההתחברות.'
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'כתובת אימייל זו כבר רשומה. נסה להתחבר.'
  if (msg.includes('Password should be') || msg.includes('at least'))
    return 'הסיסמה קצרה מדי (לפחות 6 תווים).'
  if (msg.includes('valid email')) return 'כתובת אימייל לא תקינה.'
  if (msg.includes('New password should be different'))
    return 'הסיסמה החדשה חייבת להיות שונה מהנוכחית.'
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return 'בעיית תקשורת. ודא ש-Supabase מוגדר (משתני סביבה) ונסה שוב.'
  return msg || 'אירעה שגיאה. נסה שוב.'
}
