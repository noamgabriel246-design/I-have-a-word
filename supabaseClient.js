import { createClient } from '@supabase/supabase-js'

// ============================================================================
//  חיבור ל-Supabase (אוטנטיקציה + מסד נתונים).
//  הערכים מגיעים ממשתני סביבה שמוגדרים ב-Vercel (או בקובץ .env מקומי).
// ============================================================================

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// דגל עזר (לאבחון בלבד) — האם הוגדרו ערכים אמיתיים
export const isSupabaseConfigured = url.startsWith('http') && key.length > 10

// יוצרים את ה-client. אם חסרים ערכים, נשתמש ב-placeholder תקין כדי שהאפליקציה
// לא תקרוס בטעינה (מסך לבן). פעולות אמיתיות פשוט יחזירו שגיאה ברורה עד שתגדיר.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key'
)

// אבחון ב-Console (פתח DevTools → Console)
if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.info('%c[I HAVE A WORD] Supabase מחובר ✓', 'color:#22c55e;font-weight:bold', url)
  } else {
    console.warn(
      '%c[I HAVE A WORD] Supabase לא מוגדר',
      'color:#f59e0b;font-weight:bold',
      '\nהגדר ב-Vercel את VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY, ואז בצע Redeploy.'
    )
  }
}
