import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import api from '../api/axios';

/* ============================================================
   MOCK DATA — each block maps to one Flask endpoint for Asmaa
   ============================================================ */

const CATEGORIES = [
  { id: 'js', label: 'JavaScript', short: 'JS', count: 142, solved: 34, color: '#e6db74' },
  { id: 'py', label: 'Python', short: 'PY', count: 98, solved: 12, color: '#66d9e8' },
  { id: 'sql', label: 'SQL', short: 'SQL', count: 76, solved: 30, color: '#f92672' },
  { id: 'htm', label: 'HTML/CSS', short: 'HTM', count: 10, solved: 0, color: '#fd971f' },
  { id: 'algo', label: 'Algorithms', short: 'ALG', count: 3, solved: 0, color: '#a6e22e' },
  { id: 'rea', label: 'React', short: 'REA', count: 3, solved: 0, color: '#66d9e8' },
  { id: 'nod', label: 'Node.js', short: 'NOD', count: 3, solved: 0, color: '#a6e22e' },
  { id: 'dev', label: 'DevOps', short: 'DEV', count: 3, solved: 0, color: '#fd971f' },
  { id: 'git', label: 'Git', short: 'GIT', count: 3, solved: 0, color: '#f92672' },
  { id: 'doc', label: 'Docker', short: 'DOC', count: 3, solved: 0, color: '#66d9e8' },
];

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard', authOnly: true },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Profile', path: '/profile', authOnly: true },
];

const USER_STATS = [
  { val: '47', label: 'Quizzes played', color: '#a6e22e' },
  { val: '320', label: 'Total XP', color: '#e6db74' },
  { val: '#12', label: 'Global rank', color: '#66d9e8' },
];

const GLOBAL_STATS = [
  { val: '2,480', label: 'Players', color: '#a6e22e' },
  { val: '370', label: 'Questions', color: '#e6db74' },
  { val: '184', label: 'Played today', color: '#66d9e8' },
];

const TOP_PLAYERS = [
  { rank: 1, name: 'amine_dev', xp: 2840, color: '#e6db74' },
  { rank: 2, name: 'sara.codes', xp: 2615, color: '#75715e' },
  { rank: 3, name: 'yass1ne', xp: 2402, color: '#f92672' },
];

const RECENT_ACTIVITY = [
  { tag: 'JS · EASY', color: '#e6db74', score: '8/10', xp: 40, when: '2h ago' },
  { tag: 'SQL · MEDIUM', color: '#f92672', score: '6/10', xp: 45, when: 'yesterday' },
  { tag: 'PY · EASY', color: '#66d9e8', score: '10/10', xp: 60, when: '2 days ago' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  // theme-aware overrides — only the page background + text sitting directly on it
  const pageBg = isLight ? '#e8e6dd' : '#272822';
  const onBgText = isLight ? '#272822' : '#f8f8f2';

  const [selectedCat, setSelectedCat] = useState('js');
  const [showAllCats, setShowAllCats] = useState(false);
  const [daily, setDaily] = useState(null);
  const [resetsIn, setResetsIn] = useState(0);

  const visibleLinks = NAV_LINKS.filter(link => !link.authOnly || user);
  const stats = user ? USER_STATS : GLOBAL_STATS;
  const visibleCats = showAllCats ? CATEGORIES : CATEGORIES.slice(0, 4);

  // Fetch today's daily challenge (auth-only per API)
  useEffect(() => {
    if (!user) return;
    api.get('/daily-challenge')
      .then(res => {
        setDaily(res.data.data);
        setResetsIn(res.data.data.resetsIn || 0);
      })
      .catch(() => setDaily(null));
  }, [user]);

  // Live countdown
  useEffect(() => {
    if (resetsIn <= 0) return;
    const id = setInterval(() => setResetsIn(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resetsIn > 0]);

  const formatCountdown = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStartQuiz = () => {
    if (!user) return navigate('/login');
    navigate('/quiz', { state: { category: selectedCat } });
  };

  return (
    <div style={{ ...styles.page, background: pageBg }}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.bracket}>[</span>
          <span style={styles.logoName}>CODE</span>
          <span style={styles.bracket}>]</span>
          {' '}ARENA
        </div>
        <div style={styles.navLinks}>
          {visibleLinks.map((link, i) => (
            <a
            
              key={link.label}
              onClick={() => navigate(link.path)}
              style={{
                ...styles.navLink,
                ...(i === 0 ? styles.navLinkActive : {}),
                ...(i === visibleLinks.length - 1 ? { borderRight: '2px solid #75715e' } : {}),
                cursor: 'pointer',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div style={styles.navRight}>
          <button style={styles.themeToggle} onClick={toggleTheme} title="Toggle theme">
            {isLight ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#272822">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6db74" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
              </svg>
            )}
          </button>
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
        <h1 style={{ ...styles.heroTitle, color: onBgText }}>
          <span style={styles.kw}>const</span>{' '}
          arena <span style={styles.op}>=</span>{' '}
          <span style={styles.fn}>play</span>
          <span style={{ color: onBgText }}>(</span>
          <span style={styles.str}>"now"</span>
          <span style={{ color: onBgText }}>)</span>
        </h1>
        <p style={styles.heroSub}>{'// Choose your battlefield. Prove your skills.'}</p>
      </div>

      {/* Sign-up CTA — logged-out only */}
      {!user && (
        <div style={styles.ctaWrap}>
          <div style={styles.ctaPanel}>
            <div>
              <div style={styles.panelTag}>{'// new_here'}</div>
              <div style={styles.ctaText}>Sign up to save XP, climb the leaderboard & keep your streak.</div>
            </div>
            <div style={styles.ctaBtns}>
              <button onClick={() => navigate('/login')} style={styles.loginBtn}>login()</button>
              <button onClick={() => navigate('/register')} style={styles.registerBtn}>register()</button>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div style={styles.catsGrid}>
        {visibleCats.map((cat, i, arr) => (
          <div
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            style={{
              ...styles.catCard,
              borderTop: `4px solid ${cat.color}`,
              borderRight: i < arr.length - 1 ? '3px solid #75715e' : 'none',
              ...(selectedCat === cat.id ? { background: '#3e3d32', outline: `2px solid ${cat.color}`, outlineOffset: '-2px' } : {}),
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#3e3d32'}
            onMouseLeave={e => e.currentTarget.style.background = selectedCat === cat.id ? '#3e3d32' : '#2d2c28'}
          >
            <div style={{ ...styles.catIcon, color: cat.color }}>{cat.short}</div>
            <div style={styles.catName}>{cat.label}</div>
            <div style={styles.catCount}>{cat.count} questions</div>

            {user && (
              <>
                <div style={styles.catBarTrack}>
                  <div style={{ ...styles.catBarFill, width: `${(cat.solved / cat.count) * 100}%`, background: cat.color }} />
                </div>
                <div style={styles.catSolved}>{cat.solved}/{cat.count} solved</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Show more / less categories */}
      {CATEGORIES.length > 4 && (
        <div style={styles.showMoreRow}>
          <button
            style={styles.showMoreBtn}
            onClick={() => setShowAllCats(v => !v)}
            onMouseEnter={e => { e.currentTarget.style.background = '#a6e22e'; e.currentTarget.style.color = '#272822'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a6e22e'; }}
          >
            {showAllCats ? '− show less' : `+ show ${CATEGORIES.length - 4} more`}
          </button>
        </div>
      )}

      {/* Stats — personal when logged in, global when logged out */}
      <div style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{ ...styles.statCard, background: pageBg, borderRight: i < 2 ? '3px solid #75715e' : 'none' }}>
            <div style={{ ...styles.statVal, color: stat.color }}>{stat.val}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Start */}
      <div style={{ ...styles.startRow, background: pageBg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            style={styles.startBtn}
            onClick={handleStartQuiz}
            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
          >
            ▶ START QUIZ
          </button>
          {!user && (
            <span style={styles.loginNote}>{'// login required to play & save score'}</span>
          )}
        </div>
        {user && (
          <div style={styles.streak}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f92672" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-2-1-4-2-5 0 2-1 3-3 3s-2-2-2-3c0-2 2-4 2-4z" />
            </svg>
            5 day streak
          </div>
        )}
      </div>

      {/* Daily challenge + Top players */}
      <div style={styles.panelsGrid}>

        {/* Daily challenge */}
        <div style={styles.panel}>
          <div style={styles.panelTag}>{'// daily_challenge'}</div>
          {daily ? (
            <>
              <div style={styles.dcTitle}>{daily.category?.name} challenge</div>
              <div style={styles.dcTags}>
                <span style={{ ...styles.dcPill, color: daily.category?.color || '#e6db74', borderColor: daily.category?.color || '#e6db74' }}>
                  {daily.category?.slug?.toUpperCase()}
                </span>
                <span style={{ ...styles.dcPill, color: '#f92672', borderColor: '#f92672' }}>
                  {daily.difficulty?.toUpperCase()}
                </span>
                <span style={styles.dcBonus}>+{daily.bonusXP} BONUS XP</span>
              </div>
              <div style={styles.dcFooter}>
                <span style={styles.dcTimer}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#75715e" strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  resets in {formatCountdown(resetsIn)}
                </span>
                {daily.completedToday ? (
                  <span style={styles.dcDone}>✓ COMPLETED</span>
                ) : (
                  <button
                    style={styles.dcAccept}
                    onClick={() => navigate('/quiz/play', {
                      state: {
                        category: daily.category?.slug,
                        categoryId: daily.category?._id,
                        difficulty: daily.difficulty,
                        isDailyChallenge: true,
                      },
                    })}
                    onMouseEnter={e => e.currentTarget.style.background = '#d4c95f'}
                    onMouseLeave={e => e.currentTarget.style.background = '#e6db74'}
                  >
                    ACCEPT ▶
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ ...styles.dcTimer, marginTop: '12px' }}>
              {user ? '// no challenge set for today' : '// login to view today\'s challenge'}
            </div>
          )}
        </div>

        {/* Top players */}
        <div style={styles.panel}>
          <div style={styles.panelTag}>{'// top_players'}</div>
          <div style={{ marginTop: '10px' }}>
            {TOP_PLAYERS.map((p, i) => (
              <div
                key={p.rank}
                style={{
                  ...styles.lbRow,
                  ...(i === TOP_PLAYERS.length - 1 ? { borderBottom: '2px dashed #3e3d32', paddingBottom: '8px' } : {}),
                }}
              >
                <span><span style={{ color: p.color }}>#{p.rank}</span> {p.name}</span>
                <span style={{ color: '#75715e' }}>{p.xp}</span>
              </div>
            ))}
            {user && (
              <div style={{ ...styles.lbRow, color: '#66d9e8', paddingTop: '8px' }}>
                <span>#12 you</span>
                <span>320</span>
              </div>
            )}
          </div>
          <a onClick={() => navigate('/leaderboard')} style={styles.lbLink}>view full leaderboard →</a>
        </div>
      </div>

      {/* Recent activity — logged-in only */}
      {user && (
        <div style={styles.activityWrap}>
          <div style={styles.activityPanel}>
            <div style={styles.panelTag}>{'// recent_activity'}</div>
            <div style={styles.activityGrid}>
              {RECENT_ACTIVITY.map((a) => (
                <div key={a.tag + a.when} style={styles.activityCell}>
                  <div style={{ ...styles.actTag, color: a.color }}>{a.tag}</div>
                  <div style={styles.actScore}>
                    {a.score} <span style={styles.actXp}>+{a.xp} XP</span>
                  </div>
                  <div style={styles.actWhen}>{a.when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#272822', fontFamily: "'Space Mono', monospace", paddingBottom: '24px' },

  nav: { background: '#1e1f1a', borderBottom: '3px solid #75715e', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, color: '#f8f8f2', letterSpacing: '-1px' },
  bracket: { color: '#f92672' },
  logoName: { background: '#a6e22e', color: '#272822', padding: '0 5px' },
  navLinks: { display: 'flex' },
  navLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#75715e', textDecoration: 'none', padding: '5px 14px', border: '2px solid #75715e', borderRight: 'none', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent' },
  navLinkActive: { background: '#a6e22e', color: '#272822', borderColor: '#a6e22e' },
  themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '2px solid #75715e', padding: '6px 10px', cursor: 'pointer' },
  xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', boxShadow: '3px 3px 0 rgba(230,219,116,0.3)', display: 'flex', alignItems: 'center' },
  navRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  loginBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#a6e22e', border: '2px solid #a6e22e', padding: '5px 14px', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  registerBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#272822', border: '2px solid #a6e22e', padding: '5px 14px', background: '#a6e22e', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  logoutBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#f92672', border: '2px solid #f92672', padding: '5px 14px', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },

  hero: { padding: '36px 24px 24px', borderBottom: '3px solid #3e3d32' },
  heroTag: { fontFamily: "'Space Mono', monospace", fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '14px', letterSpacing: '2px' },
  heroTitle: { fontFamily: "'Space Mono', monospace", fontSize: '36px', fontWeight: 700, color: '#f8f8f2', lineHeight: 1.1, marginBottom: '12px', letterSpacing: '-1px' },
  kw: { color: '#66d9e8' },
  op: { color: '#f92672' },
  fn: { color: '#a6e22e' },
  paren: { color: '#f8f8f2' },
  str: { color: '#e6db74' },
  heroSub: { fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#75715e', borderLeft: '4px solid #f92672', paddingLeft: '12px', margin: 0 },

  ctaWrap: { padding: '20px 24px 0' },
  ctaPanel: { border: '3px solid #a6e22e', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  ctaText: { fontFamily: "'Space Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#f8f8f2', marginTop: '6px' },
  ctaBtns: { display: 'flex', gap: '10px', flexShrink: 0 },

  catsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '3px solid #75715e', marginTop: '20px', borderTop: '3px solid #75715e' },
  catCard: { padding: '18px 20px', background: '#2d2c28', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '3px solid #75715e' },
  catIcon: { fontFamily: "'Space Mono', monospace", fontSize: '22px', fontWeight: 700, marginBottom: '8px' },
  catName: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#f8f8f2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' },
  catCount: { fontSize: '14px', color: '#75715e' },
  catBarTrack: { height: '5px', background: '#1e1f1a', border: '1px solid #3e3d32', marginTop: '10px' },
  catBarFill: { height: '100%' },
  catSolved: { fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#75715e', marginTop: '5px' },

  showMoreRow: { display: 'flex', justifyContent: 'center', padding: '14px 24px', borderBottom: '3px solid #75715e', background: '#1e1f1a' },
  showMoreBtn: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#a6e22e', border: '2px solid #a6e22e', padding: '7px 20px', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.15s' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '3px solid #75715e' },
  statCard: { padding: '18px 20px', textAlign: 'center', background: '#272822' },
  statVal: { fontFamily: "'Space Mono', monospace", fontSize: '28px', fontWeight: 700 },
  statLabel: { fontSize: '14px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },

  startRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: '#272822' },
  startBtn: { fontFamily: "'Space Mono', monospace", fontSize: '14px', fontWeight: 700, background: '#a6e22e', color: '#272822', border: '3px solid #a6e22e', padding: '12px 32px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '4px 4px 0 #3e3d32', transition: 'background 0.15s' },
  loginNote: { fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#75715e' },
  streak: { fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#e6db74', fontWeight: 700, display: 'flex', alignItems: 'center' },

  panelsGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', padding: '4px 24px 0' },
  panel: { border: '3px solid #75715e', padding: '16px 20px', background: '#2d2c28' },
  panelTag: { fontFamily: "'Space Mono', monospace", fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', letterSpacing: '2px' },

  dcTitle: { fontFamily: "'Space Mono', monospace", fontSize: '17px', fontWeight: 700, color: '#f8f8f2', marginTop: '12px' },
  dcTags: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' },
  dcPill: { fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, padding: '2px 8px', border: '2px solid', letterSpacing: '1px' },
  dcBonus: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#a6e22e' },
  dcFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' },
  dcTimer: { fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#75715e', display: 'flex', alignItems: 'center' },
  dcAccept: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '6px 14px', cursor: 'pointer', boxShadow: '3px 3px 0 rgba(230,219,116,0.3)', transition: 'background 0.15s' },
  dcDone: { fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#a6e22e', border: '2px solid #a6e22e', padding: '6px 14px', letterSpacing: '1px', cursor: 'not-allowed' },

  lbRow: { fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#f8f8f2', display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
  lbLink: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#75715e', display: 'inline-block', marginTop: '10px', cursor: 'pointer' },

  activityWrap: { padding: '16px 24px 0' },
  activityPanel: { border: '3px solid #f92672', padding: '16px 20px', background: '#2d2c28' },
  activityGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' },
  activityCell: { border: '2px solid #3e3d32', padding: '10px 12px' },
  actTag: { fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '1px' },
  actScore: { fontFamily: "'Space Mono', monospace", fontSize: '15px', fontWeight: 700, color: '#f8f8f2', margin: '4px 0' },
  actXp: { fontSize: '10px', color: '#a6e22e' },
  actWhen: { fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#75715e' },

};