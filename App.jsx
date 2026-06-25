import { useState, useEffect, createContext, useContext } from 'react'
import {
  BrowserRouter, Routes, Route, Link, NavLink, Navigate, Outlet,
  useNavigate, useLocation,
} from 'react-router-dom'
import { supabase } from './supabaseClient'
import { EXAMPLES } from './data'
import {
  findWords, saveSearch, getSearches, deleteSearch,
  saveWord, getSavedWords, removeSavedWord,
  signUpUser, signInUser, signOutUser, resetPasswordEmail,
  verifyCurrentPassword, updateUserPassword, updateDisplayName,
  translateAuthError,
} from './support'

/* ============================================================================
   1) אייקונים (SVG פנימי, ללא ספריות חיצוניות)
   ========================================================================== */
function Svg({ size = 20, children, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}
const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>
const HistoryIcon = (p) => <Svg {...p}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></Svg>
const BookmarkIcon = (p) => <Svg {...p}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>
const UserIcon = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></Svg>
const SettingsIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>
const CrownIcon = (p) => <Svg {...p}><path d="M2 18h20" /><path d="m4 18-1.5-9 5 3.5L12 5l4.5 7.5 5-3.5L20 18" /></Svg>
const LogoutIcon = (p) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
const MenuIcon = (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>
const TrashIcon = (p) => <Svg {...p}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></Svg>
const SparklesIcon = (p) => <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" /></Svg>
const CheckIcon = (p) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>
const GlobeIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" /></Svg>
const KeyIcon = (p) => <Svg {...p}><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 9-9" /><path d="m16 6 3 3" /><path d="m19 3 2 2" /></Svg>

/* ============================================================================
   2) Auth Context — ניהול ההתחברות בכל האפליקציה
   ========================================================================== */
const AuthContext = createContext(null)

function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth חייב להיות בתוך AuthProvider')
  return ctx
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    supabase.auth.getSession()
      .then(({ data }) => { if (active) { setUser(data.session?.user ?? null); setLoading(false) } })
      .catch(() => { if (active) setLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password')
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  const signIn = async (email, password) => signInUser(email, password)
  const signUp = async (email, password, fullName) => signUpUser(email, password, fullName)
  const signOut = async () => { await signOutUser(); setUser(null) }
  const resetPassword = (email) => resetPasswordEmail(email)
  const refreshName = async (fullName) => {
    await updateDisplayName(fullName)
    const { data } = await supabase.auth.getUser()
    setUser(data?.user ?? null)
  }

  const value = { user, loading, signIn, signUp, signOut, resetPassword, refreshName }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ============================================================================
   3) רכיבים משותפים
   ========================================================================== */
function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" aria-label="I HAVE A WORD - דף הבית">
          <span className="brand-logo">W</span>
          <span className="brand-name">I HAVE A WORD</span>
        </Link>
        <nav className="navbar-actions">
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>לאזור האישי</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">התחברות</Link>
              <Link to="/register" className="btn btn-primary btn-sm">הרשמה חינם</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-links">
          <Link to="/">דף הבית</Link>
          <Link to="/login">התחברות</Link>
          <Link to="/register">הרשמה</Link>
        </div>
        <p className="footer-copy">© {year} <span className="brand-name">I HAVE A WORD</span> — המילה על קצה הלשון</p>
      </div>
    </footer>
  )
}

function Sidebar({ open, onNavigate }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  async function handleLogout() { await signOut(); navigate('/') }
  const links = [
    { to: '/dashboard', label: 'חיפוש מילה', Icon: SearchIcon },
    { to: '/history', label: 'היסטוריית חיפושים', Icon: HistoryIcon },
    { to: '/saved', label: 'מילים שמורות', Icon: BookmarkIcon },
    { to: '/premium', label: 'שדרוג לפרימיום', Icon: CrownIcon },
    { to: '/profile', label: 'פרופיל', Icon: UserIcon },
    { to: '/settings', label: 'הגדרות', Icon: SettingsIcon },
  ]
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-logo">W</span>
        <span className="brand-name">I HAVE A WORD</span>
      </div>
      <nav>
        {links.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onNavigate}>
            <Icon className="icon" size={20} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-user">
        <div className="sidebar-user-email"><span className="ltr">{user?.email}</span></div>
        <button className="nav-link" onClick={handleLogout} style={{ width: '100%' }}>
          <LogoutIcon className="icon" size={20} /><span>התנתקות</span>
        </button>
      </div>
    </aside>
  )
}

function AppLayout() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <div className="app-shell">
        <Sidebar open={open} onNavigate={close} />
        <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={close} aria-hidden="true" />
        <main className="app-main">
          <button className="sidebar-toggle" onClick={() => setOpen(true)}>
            <MenuIcon size={20} /><span>תפריט</span>
          </button>
          <Outlet />
        </main>
      </div>
    </>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function WordCard({ word, saved, onSave }) {
  return (
    <article className="word-card">
      <div className="match">
        <div className="match-ring" style={{ '--val': word.match }}>{word.match}%</div>
        <span className="match-label">התאמה</span>
      </div>
      <div className="word-card-main">
        <div className="word-card-title"><h3 className="auto-dir">{word.word}</h3></div>
        <p className="word-card-def auto-dir">{word.definition}</p>
        {word.reason && (
          <p className="word-card-reason auto-dir"><SparklesIcon size={14} /> {word.reason}</p>
        )}
      </div>
      <button className={`btn btn-sm ${saved ? 'btn-accent' : 'btn-secondary'}`} onClick={() => onSave(word)} disabled={saved}>
        {saved ? <CheckIcon size={16} /> : <BookmarkIcon size={16} />}
        {saved ? 'נשמר' : 'שמירה'}
      </button>
    </article>
  )
}

function HistoryItem({ item, onOpen, onDelete }) {
  const date = new Date(item.created_at)
  const dateStr = date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const count = Array.isArray(item.results) ? item.results.length : 0
  return (
    <div className="history-item">
      <button type="button" className="history-item-main" onClick={() => onOpen(item)}
        style={{ background: 'none', border: 0, textAlign: 'start', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
        <div className="history-item-query auto-dir">{item.query}</div>
        <div className="history-item-meta">
          <span className="ltr">{dateStr}</span> · <span className="ltr">{timeStr}</span> · {count} הצעות
        </div>
      </button>
      <button className="icon-btn" onClick={() => onOpen(item)} aria-label="הרץ חיפוש שוב" title="הרץ שוב"><SearchIcon size={18} /></button>
      {onDelete && (
        <button className="icon-btn danger" onClick={() => onDelete(item.id)} aria-label="מחק חיפוש" title="מחק"><TrashIcon size={18} /></button>
      )}
    </div>
  )
}

/* ============================================================================
   4) עמודים ציבוריים
   ========================================================================== */
function LandingPage() {
  return (
    <>
      <Navbar />
      <section className="hero">
        <div>
          <span className="hero-eyebrow"><SparklesIcon size={16} /> מופעל בבינה מלאכותית</span>
          <h1>המילה על <span className="accent">קצה הלשון?</span><br />אנחנו נמצא אותה.</h1>
          <p className="hero-sub">
            כולנו מכירים את זה — אתה יודע בדיוק למה אתה מתכוון, אבל המילה פשוט בורחת.
            תאר אותה במילים שלך, וה-AI יציע לך את המילה המדויקת. בעברית ובאנגלית.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">בואו נתחיל — חינם</Link>
            <Link to="/login" className="btn btn-ghost btn-lg">כבר יש לי חשבון</Link>
          </div>
        </div>
        <div className="hero-demo" aria-hidden="true">
          <div className="hero-demo-label">אתה מתאר:</div>
          <div className="hero-demo-query">"התחושה הזו של געגוע מתוק לזמן שכבר עבר..."</div>
          <div className="hero-demo-label">ה-AI מציע:</div>
          <div className="hero-demo-word"><strong>נוסטלגיה</strong><span className="pill pill-accent">94%</span></div>
          <div className="hero-demo-word"><strong>ערגה</strong><span className="pill pill-accent">81%</span></div>
          <div className="hero-demo-word"><strong>כיסופים</strong><span className="pill pill-accent">76%</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>איך זה עובד?</h2><p>שלושה צעדים פשוטים מהתסכול אל המילה.</p></div>
        <div className="steps">
          <div className="step-card"><div className="step-num">1</div><h3>תאר את המילה</h3><p>כתוב בשפה חופשית כל מה שאתה זוכר — ההגדרה, ההקשר, מילים דומות, או אפילו רק תחושה.</p></div>
          <div className="step-card"><div className="step-num">2</div><h3>ה-AI מנתח</h3><p>מנוע הבינה המלאכותית סורק את המשמעות ומחפש את המילים שמתאימות בדיוק לכוונה שלך.</p></div>
          <div className="step-card"><div className="step-num">3</div><h3>מצא ושמור</h3><p>קבל רשימת הצעות מדורגות לפי התאמה, שמור את המילים האהובות, וחזור אליהן מתי שתרצה.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <h2>אף פעם לא תישאר שוב בלי מילים</h2>
          <p>הצטרף עכשיו והתחל למצוא את המילים שבורחות לך — בחינם.</p>
          <Link to="/register" className="btn btn-accent btn-lg">פתח חשבון חינם</Link>
        </div>
      </section>
      <Footer />
    </>
  )
}

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(translateAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>ברוך שובך 👋</h1>
          <p className="auth-sub">התחבר כדי להמשיך למצוא מילים</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="email">אימייל</label>
              <input id="email" type="email" className="input ltr" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="field">
              <label className="label" htmlFor="password">סיסמה</label>
              <input id="password" type="password" className="input ltr" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="auth-link-small"><Link to="/forgot-password">שכחת סיסמה?</Link></div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner spinner-light" /> : 'התחברות'}
            </button>
          </form>
          <p className="auth-foot">אין לך חשבון עדיין? <Link to="/register">הרשמה חינם</Link></p>
        </div>
      </div>
      <Footer />
    </>
  )
}

function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים.'); return }
    setLoading(true)
    try {
      const r = await signUp(email, password, fullName)
      if (r?.data?.session) {
        navigate('/dashboard')
      } else {
        setInfo('נרשמת בהצלחה! אם נדרש אישור מייל — בדוק את תיבת הדואר ואז התחבר. אחרת, פשוט התחבר.')
      }
    } catch (err) {
      setError(translateAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>פתיחת חשבון</h1>
          <p className="auth-sub">דקה אחת, וכבר לא תאבד אף מילה</p>
          {error && <div className="alert alert-error">{error}</div>}
          {info && <div className="alert alert-success">{info}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="name">שם מלא</label>
              <input id="name" type="text" className="input" placeholder="ישראל ישראלי"
                value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
            <div className="field">
              <label className="label" htmlFor="email">אימייל</label>
              <input id="email" type="email" className="input ltr" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="field">
              <label className="label" htmlFor="password">סיסמה</label>
              <input id="password" type="password" className="input ltr" placeholder="לפחות 6 תווים"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner spinner-light" /> : 'יצירת חשבון'}
            </button>
          </form>
          <p className="auth-foot">כבר רשום? <Link to="/login">התחברות</Link></p>
        </div>
      </div>
      <Footer />
    </>
  )
}

function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try { await resetPassword(email); setSent(true) }
    catch { setSent(true) } // לא חושפים אם המייל קיים (אבטחה)
    finally { setLoading(false) }
  }

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>איפוס סיסמה</h1>
          <p className="auth-sub">נשלח אליך קישור לאיפוס הסיסמה</p>
          {sent ? (
            <>
              <div className="alert alert-success">אם הכתובת קיימת במערכת, שלחנו אליה קישור לאיפוס סיסמה. בדוק את תיבת המייל.</div>
              <Link to="/login" className="btn btn-primary btn-block">חזרה להתחברות</Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="label" htmlFor="email">אימייל</label>
                <input id="email" type="email" className="input ltr" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? <span className="spinner spinner-light" /> : 'שלח קישור איפוס'}
              </button>
            </form>
          )}
          <p className="auth-foot">נזכרת בסיסמה? <Link to="/login">חזרה להתחברות</Link></p>
        </div>
      </div>
      <Footer />
    </>
  )
}

// מסך קביעת סיסמה חדשה — מגיעים אליו דרך הקישור במייל איפוס הסיסמה.
function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים.'); return }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות.'); return }
    setLoading(true)
    try {
      await updateUserPassword(password)
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(translateAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>בחירת סיסמה חדשה</h1>
          <p className="auth-sub">הזן את הסיסמה החדשה שלך</p>
          {error && <div className="alert alert-error">{error}</div>}
          {done ? (
            <div className="alert alert-success">הסיסמה עודכנה בהצלחה! מעבירים אותך…</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="label" htmlFor="np">סיסמה חדשה</label>
                <input id="np" type="password" className="input ltr" placeholder="לפחות 6 תווים"
                  value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <div className="field">
                <label className="label" htmlFor="cp">אימות סיסמה</label>
                <input id="cp" type="password" className="input ltr" placeholder="הקלד שוב"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? <span className="spinner spinner-light" /> : 'עדכן סיסמה'}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

/* ============================================================================
   5) עמודים מוגנים
   ========================================================================== */
function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState([])
  const firstName = (user?.user_metadata?.full_name || user?.email || '').split('@')[0].split(' ')[0]

  useEffect(() => {
    let active = true
    getSearches(user.id).then((rows) => { if (active) setRecent(rows.slice(0, 3)) })
    return () => { active = false }
  }, [user.id])

  async function runSearch(text) {
    const q = (text ?? query).trim()
    if (!q || loading) return
    setLoading(true)
    try {
      const words = await findWords(q)
      const saved = await saveSearch(user.id, q, words)
      navigate('/results', { state: { query: q, words, searchId: saved?.id } })
    } catch (err) {
      alert(translateAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-head"><h1>שלום, {firstName} 👋</h1><p>איזו מילה בורחת לך היום?</p></div>
      <form className="search-card" onSubmit={(e) => { e.preventDefault(); runSearch() }}>
        <h2>תאר את המילה</h2>
        <p className="hint">כתוב בשפה חופשית כל מה שאתה זוכר — הגדרה, הקשר, מילים דומות, או סתם תחושה.</p>
        <textarea className="textarea auto-dir" placeholder="לדוגמה: המילה שמתארת כשמישהו מרגיש שמחה לאיד..."
          value={query} onChange={(e) => setQuery(e.target.value)} maxLength={300} />
        <div className="search-row">
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading || !query.trim()}>
            {loading ? <><span className="spinner spinner-light" /> מחפש מילים...</> : <><SparklesIcon size={18} /> מצא את המילה</>}
          </button>
        </div>
        <div className="chips">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip" onClick={() => setQuery(ex)}>{ex}</button>
          ))}
        </div>
      </form>
      {recent.length > 0 && (
        <section>
          <div className="page-head" style={{ marginBlockEnd: 'var(--space-3)' }}><h3>חיפושים אחרונים</h3></div>
          <div className="list-stack">
            {recent.map((item) => (
              <HistoryItem key={item.id} item={item}
                onOpen={(it) => navigate('/results', { state: { query: it.query, words: it.results, searchId: it.id } })} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function ResultsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || readSession()
  const [savedWords, setSavedWords] = useState(new Set())

  useEffect(() => {
    if (location.state) sessionStorage.setItem('ihaveaword_last_results', JSON.stringify(location.state))
  }, [location.state])

  useEffect(() => {
    getSavedWords(user.id).then((rows) => setSavedWords(new Set(rows.map((r) => r.word))))
  }, [user.id])

  async function handleSave(word) {
    await saveWord(user.id, word)
    setSavedWords((prev) => new Set(prev).add(word.word))
  }

  if (!state || !state.words) {
    return (
      <div className="empty">
        <div className="empty-icon"><SearchIcon size={28} /></div>
        <h3>אין תוצאות להצגה</h3>
        <p>חזור למסך החיפוש כדי לחפש מילה.</p><br />
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>למסך החיפוש</button>
      </div>
    )
  }

  const { query, words } = state
  return (
    <>
      <div className="page-head"><h1>הצעות עבורך</h1><p>מצאנו {words.length} מילים שעשויות להתאים. שמור את מה שמדבר אליך.</p></div>
      <div className="results-summary"><div className="caption">חיפשת:</div><p className="auto-dir">"{query}"</p></div>
      <div className="results-list">
        {words.map((word, i) => (
          <WordCard key={word.word + i} word={word} saved={savedWords.has(word.word)} onSave={handleSave} />
        ))}
      </div>
      <div style={{ marginBlockStart: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>חיפוש חדש</button>
        <button className="btn btn-ghost" onClick={() => navigate('/saved')}>למילים השמורות שלי</button>
      </div>
    </>
  )
}
function readSession() {
  try { return JSON.parse(sessionStorage.getItem('ihaveaword_last_results') || 'null') } catch { return null }
}

function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getSearches(user.id).then(setItems).finally(() => setLoading(false)) }, [user.id])

  async function handleDelete(id) {
    await deleteSearch(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <>
      <div className="page-head"><h1>היסטוריית חיפושים</h1><p>כל המילים שחיפשת — לחץ על חיפוש כדי לראות אותו שוב.</p></div>
      {loading ? <div className="spinner spinner-center" /> : items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><HistoryIcon size={28} /></div>
          <h3>עדיין לא חיפשת כלום</h3><p>החיפושים שלך יופיעו כאן אוטומטית.</p><br />
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>התחל לחפש</button>
        </div>
      ) : (
        <div className="list-stack">
          {items.map((item) => (
            <HistoryItem key={item.id} item={item}
              onOpen={(it) => navigate('/results', { state: { query: it.query, words: it.results, searchId: it.id } })}
              onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  )
}

function SavedWordsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getSavedWords(user.id).then(setWords).finally(() => setLoading(false)) }, [user.id])

  async function handleRemove(id) {
    await removeSavedWord(id)
    setWords((prev) => prev.filter((w) => w.id !== id))
  }

  return (
    <>
      <div className="page-head"><h1>המילים השמורות שלי</h1><p>אוסף המילים שמצאת ושמרת לעצמך.</p></div>
      {loading ? <div className="spinner spinner-center" /> : words.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><BookmarkIcon size={28} /></div>
          <h3>עדיין אין מילים שמורות</h3><p>כשתמצא מילה שאהבת, לחץ "שמירה" והיא תופיע כאן.</p><br />
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>למסך החיפוש</button>
        </div>
      ) : (
        <div className="list-stack">
          {words.map((w) => (
            <div className="word-card" key={w.id}>
              <div className="word-card-main">
                <div className="word-card-title">
                  <h3 className="auto-dir">{w.word}</h3>
                  {w.match_score != null && <span className="pill pill-accent">{w.match_score}%</span>}
                </div>
                <p className="word-card-def auto-dir">{w.definition}</p>
              </div>
              <button className="icon-btn danger" onClick={() => handleRemove(w.id)} aria-label="הסר מהשמורים" title="הסר"><TrashIcon size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ searches: 0, saved: 0 })
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'משתמש'
  const initial = fullName.trim().charAt(0).toUpperCase()

  useEffect(() => {
    Promise.all([getSearches(user.id), getSavedWords(user.id)]).then(([s, w]) => setStats({ searches: s.length, saved: w.length }))
  }, [user.id])

  return (
    <>
      <div className="page-head"><h1>הפרופיל שלי</h1><p>הפרטים והפעילות שלך באפליקציה.</p></div>
      <div className="card">
        <div className="profile-head">
          <div className="avatar">{initial}</div>
          <div>
            <h2 style={{ marginBlockEnd: 4 }} className="auto-dir">{fullName}</h2>
            <p className="text-muted ltr" style={{ textAlign: 'start' }}>{user?.email}</p>
          </div>
        </div>
        <hr className="divider" />
        <div className="settings-row"><div><strong>חיפושים שביצעת</strong><p className="caption">סך כל פעולות החיפוש</p></div><span className="pill">{stats.searches}</span></div>
        <div className="settings-row"><div><strong>מילים שמורות</strong><p className="caption">מילים שבחרת לשמור</p></div><span className="pill pill-accent">{stats.saved}</span></div>
        <div className="settings-row"><div><strong>סוג חשבון</strong><p className="caption">המסלול הנוכחי שלך</p></div><span className="pill">חינמי</span></div>
      </div>
    </>
  )
}

function SettingsPage() {
  const { user, signOut, refreshName } = useAuth()
  const navigate = useNavigate()
  const [lang, setLang] = useState('he')

  // שם תצוגה
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [nameMsg, setNameMsg] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  // שינוי סיסמה
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ihaveaword_search_lang')
    if (saved) setLang(saved)
  }, [])

  function changeLang(value) { setLang(value); localStorage.setItem('ihaveaword_search_lang', value) }
  async function handleLogout() { await signOut(); navigate('/') }

  async function handleNameSave(e) {
    e.preventDefault()
    setNameMsg(''); setNameLoading(true)
    try {
      await refreshName(name.trim())
      setNameMsg('השם עודכן בהצלחה ✓')
    } catch (err) {
      setNameMsg(translateAuthError(err.message))
    } finally {
      setNameLoading(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError(''); setPwMsg('')
    if (newPw.length < 6) { setPwError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים.'); return }
    if (newPw !== confirmPw) { setPwError('הסיסמאות החדשות אינן תואמות.'); return }
    setPwLoading(true)
    try {
      // אבטחה: מאמתים את הסיסמה הנוכחית לפני השינוי
      await verifyCurrentPassword(user.email, curPw)
      await updateUserPassword(newPw)
      setPwMsg('הסיסמה עודכנה בהצלחה ✓')
      setCurPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwError(translateAuthError(err.message))
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <>
      <div className="page-head"><h1>הגדרות</h1><p>התאם את האפליקציה להעדפות שלך ונהל את החשבון.</p></div>

      {/* פרטי חשבון — שם תצוגה */}
      <div className="card">
        <form onSubmit={handleNameSave}>
          <div className="settings-row" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserIcon size={18} /> שם תצוגה</strong>
              <p className="caption">השם שמופיע בפרופיל ובברכה</p>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="השם שלך" style={{ marginBlockStart: 8 }} />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" disabled={nameLoading || !name.trim()}>
              {nameLoading ? <span className="spinner" /> : 'שמור'}
            </button>
          </div>
          {nameMsg && <p className="caption" style={{ marginBlockStart: 8, color: 'var(--color-success)' }}>{nameMsg}</p>}
        </form>
      </div>

      {/* שינוי סיסמה */}
      <div className="card" style={{ marginBlockStart: 'var(--space-4)' }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}><KeyIcon size={18} /> שינוי סיסמה</strong>
        <p className="caption" style={{ marginBlockEnd: 'var(--space-4)' }}>מומלץ סיסמה חזקה באורך 6 תווים לפחות.</p>
        {pwError && <div className="alert alert-error">{pwError}</div>}
        {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
        <form onSubmit={handlePasswordChange}>
          <div className="field">
            <label className="label" htmlFor="curpw">סיסמה נוכחית</label>
            <input id="curpw" type="password" className="input ltr" value={curPw} onChange={(e) => setCurPw(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className="field">
            <label className="label" htmlFor="newpw">סיסמה חדשה</label>
            <input id="newpw" type="password" className="input ltr" placeholder="לפחות 6 תווים" value={newPw} onChange={(e) => setNewPw(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label className="label" htmlFor="confpw">אימות סיסמה חדשה</label>
            <input id="confpw" type="password" className="input ltr" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
            {pwLoading ? <span className="spinner spinner-light" /> : 'עדכן סיסמה'}
          </button>
        </form>
      </div>

      {/* העדפות חיפוש */}
      <div className="card" style={{ marginBlockStart: 'var(--space-4)' }}>
        <div className="settings-row">
          <div>
            <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}><GlobeIcon size={18} /> שפת חיפוש מועדפת</strong>
            <p className="caption">באיזו שפה תרצה לקבל הצעות מילים</p>
          </div>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'he' ? 'active' : ''}`} onClick={() => changeLang('he')}>עברית</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => changeLang('en')}>English</button>
          </div>
        </div>
        <div className="settings-row">
          <div><strong>שדרוג לפרימיום</strong><p className="caption">חיפושים ללא הגבלה ותכונות נוספות</p></div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/premium')}>צפה במסלולים</button>
        </div>
      </div>

      {/* התנתקות */}
      <div className="card" style={{ marginBlockStart: 'var(--space-4)' }}>
        <div className="settings-row">
          <div><strong>התנתקות</strong><p className="caption">יציאה מהחשבון במכשיר הזה</p></div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>התנתק</button>
        </div>
      </div>
    </>
  )
}

function PremiumPage() {
  return (
    <>
      <div className="page-head"><h1>שדרוג לפרימיום</h1><p>פתח את כל היכולות של I HAVE A WORD בתשלום חד-פעמי.</p></div>
      <div className="plans">
        <div className="plan">
          <h3>חינמי</h3>
          <div className="plan-price">₪0</div>
          <div className="plan-features">
            <div className="plan-feature"><CheckIcon className="check" size={18} /> עד 10 חיפושים ביום</div>
            <div className="plan-feature"><CheckIcon className="check" size={18} /> שמירת מילים</div>
            <div className="plan-feature"><CheckIcon className="check" size={18} /> היסטוריית חיפושים</div>
            <div className="plan-feature"><CheckIcon className="check" size={18} /> עברית ואנגלית</div>
          </div>
          <button className="btn btn-ghost btn-block" disabled>המסלול הנוכחי שלך</button>
        </div>
        <div className="plan featured">
          <span className="plan-badge">הכי משתלם</span>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CrownIcon size={22} /> פרימיום</h3>
          <div className="plan-price">₪49 <small>/ חד-פעמי</small></div>
          <div className="plan-features">
            <div className="plan-feature"><CheckIcon className="check" size={18} /> חיפושים <strong>ללא הגבלה</strong></div>
            <div className="plan-feature"><CheckIcon className="check" size={18} /> הצעות מורחבות (10 מילים)</div>
            <div className="plan-feature"><CheckIcon className="check" size={18} /> הגדרות והקשר מפורטים</div>
            <div className="plan-feature"><CheckIcon className="check" size={18} /> ללא פרסומות, לתמיד</div>
            <div className="plan-feature"><CheckIcon className="check" size={18} /> תמיכה מהירה</div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => alert('חיבור תשלומים (Stripe) — שלב עתידי לפי התכנון 🙂')}>שדרג עכשיו</button>
        </div>
      </div>
      <div className="alert alert-info" style={{ marginBlockStart: 'var(--space-5)' }}>
        💡 חיבור התשלומים בפועל (Stripe) מתוכנן כשלב הבא. הכפתור כרגע להדגמה.
      </div>
    </>
  )
}

function NotFoundPage() {
  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="text-center">
          <h1 style={{ fontSize: 72, marginBlockEnd: 8 }}>404</h1>
          <h2 style={{ marginBlockEnd: 16 }}>הדף לא נמצא</h2>
          <p className="text-muted" style={{ marginBlockEnd: 24 }}>כנראה שגם הכתובת הזו על קצה הלשון... אבל היא לא קיימת.</p>
          <Link to="/" className="btn btn-primary btn-lg">חזרה לדף הבית</Link>
        </div>
      </div>
      <Footer />
    </>
  )
}

/* ============================================================================
   6) האפליקציה — ניווט בין כל העמודים
   ========================================================================== */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ציבורי */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* מוגן (תחת AppLayout עם תפריט צד) */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/saved" element={<SavedWordsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/premium" element={<PremiumPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
