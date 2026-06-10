import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const CATEGORIES = [
  { id: 'js', label: 'JavaScript', short: 'JS', count: 142, color: '#e6db74' },
  { id: 'py', label: 'Python', short: 'PY', count: 98, color: '#66d9e8' },
  { id: 'sql', label: 'SQL', short: 'SQL', count: 76, color: '#f92672' },
  { id: 'algo', label: 'Algorithms', short: 'AL', count: 54, color: '#a6e22e' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Profile', path: '/profile' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.bracket}>[</span>
          <span style={styles.logoName}>CODE</span>
          <span style={styles.bracket}>]</span>
          {' '}ARENA
        </div>
        <div style={styles.navLinks}>
          {NAV_LINKS.map((link, i) => (
            <a

              key={link.label}
              onClick={() => navigate(link.path)}
              style={{
                ...styles.navLink,
                ...(i === 0 ? styles.navLinkActive : {}),
                ...(i === NAV_LINKS.length - 1 ? { borderRight: '2px solid #75715e' } : {}),
                cursor: 'pointer',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div style={styles.navRight}>
          {user ? (
            <>
              <div style={styles.xpBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                {user.totalXP || 0} XP
              </div>
              <button onClick={async () => { await logout(); }} style={styles.logoutBtn}>logout()</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={styles.loginBtn}>login()</button>
              <button onClick={() => navigate('/register')} style={styles.registerBtn}>register()</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroTag}>{'// select_category'}</div>
        <h1 style={styles.heroTitle}>
          <span style={styles.kw}>const</span>{' '}
          arena <span style={styles.op}>=</span>{' '}
          <span style={styles.fn}>play</span>
          <span style={styles.paren}>(</span>
          <span style={styles.str}>"now"</span>
          <span style={styles.paren}>)</span>
        </h1>
        <p style={styles.heroSub}>{'// Choose your battlefield. Prove your skills.'}</p>
      </div>

      {/* Categories */}
      <div style={styles.catsGrid}>
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            style={{
              ...styles.catCard,
              borderTop: `4px solid ${cat.color}`,
              borderRight: i < CATEGORIES.length - 1 ? '3px solid #75715e' : 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#3e3d32'}
            onMouseLeave={e => e.currentTarget.style.background = '#2d2c28'}
          >
            <div style={{ ...styles.catIcon, color: cat.color }}>{cat.short}</div>
            <div style={styles.catName}>{cat.label}</div>
            <div style={styles.catCount}>{cat.count} questions</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {[
          { val: '47', label: 'Quizzes played', color: '#a6e22e' },
          { val: '320', label: 'Total XP', color: '#e6db74' },
          { val: '#12', label: 'Global rank', color: '#66d9e8' },
        ].map((stat, i) => (
          <div key={stat.label} style={{ ...styles.statCard, borderRight: i < 2 ? '3px solid #75715e' : 'none' }}>
            <div style={{ ...styles.statVal, color: stat.color }}>{stat.val}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Difficulty */}
      <div style={styles.diffRow}>
        <span style={styles.diffLabel}>Difficulty:</span>
        {DIFFICULTIES.map((d, i) => (
          <button
            key={d}
            style={{
              ...styles.diffBtn,
              borderRight: i === DIFFICULTIES.length - 1 ? '2px solid #75715e' : 'none',
              ...(i === 0 ? styles.diffBtnActive : {}),
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Start */}
      <div style={styles.startRow}>
        <button
          style={styles.startBtn}
          onClick={() => navigate(user ? '/quiz' : '/login')}
          onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
          onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
        >
          ▶ START QUIZ
        </button>
        <div style={styles.streak}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f92672" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-2-1-4-2-5 0 2-1 3-3 3s-2-2-2-3c0-2 2-4 2-4z" />
          </svg>
          5 day streak
        </div>
      </div>

    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#272822', fontFamily: "'Space Mono', monospace" },

  nav: { background: '#1e1f1a', borderBottom: '3px solid #75715e', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, color: '#f8f8f2', letterSpacing: '-1px' },
  bracket: { color: '#f92672' },
  logoName: { background: '#a6e22e', color: '#272822', padding: '0 5px' },
  navLinks: { display: 'flex' },
  navLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#75715e', textDecoration: 'none', padding: '5px 14px', border: '2px solid #75715e', borderRight: 'none', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent' },
  navLinkActive: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
  xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', boxShadow: '3px 3px 0 rgba(230,219,116,0.3)', display: 'flex', alignItems: 'center' },

  hero: { padding: '36px 24px 24px', borderBottom: '3px solid #3e3d32' },
  heroTag: { fontFamily: "'Space Mono', monospace", fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '14px', letterSpacing: '2px' },
  heroTitle: { fontFamily: "'Space Mono', monospace", fontSize: '36px', fontWeight: 700, color: '#f8f8f2', lineHeight: 1.1, marginBottom: '12px', letterSpacing: '-1px' },
  kw: { color: '#66d9e8' },
  op: { color: '#f92672' },
  fn: { color: '#a6e22e' },
  paren: { color: '#f8f8f2' },
  str: { color: '#e6db74' },
  heroSub: { fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#75715e', borderLeft: '4px solid #f92672', paddingLeft: '12px', margin: 0 },

  catsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '3px solid #75715e' },
  catCard: { padding: '18px 20px', background: '#2d2c28', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '3px solid #75715e' },
  catIcon: { fontFamily: "'Space Mono', monospace", fontSize: '22px', fontWeight: 700, marginBottom: '8px' },
  catName: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#f8f8f2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' },
  catCount: { fontSize: '14px', color: '#75715e' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '3px solid #75715e' },
  statCard: { padding: '18px 20px', textAlign: 'center', background: '#272822' },
  statVal: { fontFamily: "'Space Mono', monospace", fontSize: '28px', fontWeight: 700 },
  statLabel: { fontSize: '14px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },

  diffRow: { display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '3px solid #75715e', background: '#1e1f1a' },
  diffLabel: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#75715e', marginRight: '14px', textTransform: 'uppercase', letterSpacing: '1px' },
  diffBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, padding: '6px 16px', border: '2px solid #75715e', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent', color: '#75715e' },
  diffBtnActive: { background: '#f92672', color: '#f8f8f2', borderColor: '#f92672' },

  startRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: '#272822' },
  startBtn: { fontFamily: "'Space Mono', monospace", fontSize: '14px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '12px 32px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },
  streak: { fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#e6db74', fontWeight: 700, display: 'flex', alignItems: 'center' },
  navRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  loginBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#a6e22e', border: '2px solid #a6e22e', padding: '5px 14px', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  registerBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#272822', border: '2px solid #a6e22e', padding: '5px 14px', background: '#a6e22e', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  logoutBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#f92672', border: '2px solid #f92672', padding: '5px 14px', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
};