import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import { useTheme } from '../Context/ThemeContext';
import { getThemeColors } from '../Constants/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import api from '../API/axios';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard', authOnly: true },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Profile', path: '/profile', authOnly: true },
];

const GLOBAL_STATS = [
  { val: '2,480', label: 'Players', color: '#a6e22e' },
  { val: '370', label: 'Questions', color: '#e6db74' },
  { val: '184', label: 'Played today', color: '#66d9e8' },
];

const themeColor = (hex, t) => {
  if (hex === '#e6db74') return t.yellow;
  if (hex === '#a6e22e') return t.green;
  return hex;
};

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = getThemeColors(theme);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  const [selectedCat, setSelectedCat] = useState('js');
  const [showAllCats, setShowAllCats] = useState(false);
  const [daily, setDaily] = useState(null);
  const [resetsIn, setResetsIn] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Real API state
  const [topPlayers, setTopPlayers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [categories, setCategories] = useState([]);

  // Real user stats
  const USER_STATS = [
    { val: user?.quizzesPlayed || 0, label: 'Quizzes played', color: '#a6e22e' },
    { val: user?.totalXP || 0, label: 'Total XP', color: '#e6db74' },
    { val: myRank ? `#${myRank.globalRank}` : '-', label: 'Global rank', color: '#66d9e8' },
  ];

  const visibleLinks = NAV_LINKS.filter(link => !link.authOnly || user);
  const stats = user ? USER_STATS : GLOBAL_STATS;
  const visibleCats = showAllCats ? categories : categories.slice(0, 4);

  // Fetch categories, top players, rank, recent activity
  useEffect(() => {
    api.get('/categories')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data.map(cat => ({
            id: cat.slug,
            label: cat.name,
            short: cat.slug.toUpperCase().slice(0, 3),
            count: cat.questionCount || 0,
            solved: 0,
            color: cat.color || '#a6e22e',
          })));
        }
      })
      .catch(() => {});

    api.get('/leaderboard?limit=3')
      .then(res => setTopPlayers(res.data.data || []))
      .catch(() => {});

    if (user) {
      api.get('/leaderboard/me')
        .then(res => setMyRank(res.data.data))
        .catch(() => {});
      api.get(`/history/${user.username}`)
        .then(res => setRecentActivity(res.data.data?.slice(0, 3) || []))
        .catch(() => {});
    }
  }, [user]);

  // Fetch category stats for progress bars
  useEffect(() => {
    if (!user) return;
    api.get(`/history/stats/${user.username}`)
      .then(res => {
        const statsArray = res.data.data || [];
        const statsMap = {};
        statsArray.forEach(s => { statsMap[s.categorySlug] = { solved: s.totalSolved }; });
        setCategories(prev => prev.map(cat => ({
          ...cat,
          solved: statsMap[cat.id]?.solved || 0,
        })));
      })
      .catch(() => {});
  }, [user]);

  // Fetch daily challenge
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
    <div style={{ ...styles.page, background: t.pageBg }}>

      {/* Navbar */}
      <nav style={{ ...styles.nav, background: t.navBg, borderBottomColor: t.border, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div style={styles.logo}>
          <span style={styles.bracket}>[</span>
          <span style={styles.logoName}>CODE</span>
          <span style={styles.bracket}>]</span>
          {' '}ARENA
        </div>

        {!isMobile && (
          <div style={styles.navLinks}>
            {visibleLinks.map((link, i) => (
              <a
                key={link.label}
                onClick={() => navigate(link.path)}
                style={{
                  ...styles.navLink,
                  borderColor: t.border,
                  color: t.textMuted,
                  ...(i === 0 ? { ...styles.navLinkActive } : {}),
                  ...(i === visibleLinks.length - 1 ? { borderRight: `2px solid ${t.border}` } : { borderRight: 'none' }),
                  cursor: 'pointer',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div style={styles.navRight}>
          {isMobile && (
            <button style={{ ...styles.hamburger, borderColor: t.border, color: t.textMuted }} onClick={() => setMenuOpen(m => !m)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
          <button style={{ ...styles.themeToggle, borderColor: t.border }} onClick={toggleTheme} title="Toggle theme">
            {t.isLight ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#2c2c2a">
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
              {!isMobile && <button onClick={async () => { await logout(); }} style={styles.logoutBtn}>logout()</button>}
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={styles.loginBtn}>login()</button>
              {!isMobile && <button onClick={() => navigate('/register')} style={styles.registerBtn}>register()</button>}
            </>
          )}
        </div>

        {isMobile && menuOpen && (
          <div style={{ ...styles.mobileMenu, background: t.navBg, borderTopColor: t.border }}>
            {visibleLinks.map((link) => (
              <a
                key={link.label}
                onClick={() => { navigate(link.path); setMenuOpen(false); }}
                style={{ ...styles.mobileMenuItem, color: t.textMuted, borderBottomColor: t.borderLight }}
              >
                {link.label}
              </a>
            ))}
            {user && (
              <a onClick={async () => { await logout(); setMenuOpen(false); }} style={{ ...styles.mobileMenuItem, color: '#f92672', borderBottomColor: t.borderLight }}>
                logout()
              </a>
            )}
          </div>
        )}
      </nav>

      {/* Hero */}
      <div style={{ ...styles.hero, borderBottomColor: t.borderLight, padding: isMobile ? '24px 16px 20px' : '36px 24px 24px' }}>
        <div style={{ ...styles.heroTag, background: t.tagBg, color: t.textMuted }}>{'// select_category'}</div>
        <h1 style={{ ...styles.heroTitle, color: t.text, fontSize: isMobile ? '22px' : isTablet ? '28px' : '36px' }}>
          <span style={styles.kw}>const</span>{' '}
          arena <span style={styles.op}>=</span>{' '}
          <span style={styles.fn}>play</span>
          <span style={{ color: t.text }}>(</span>
          <span style={{ ...styles.str, color: t.yellow }}>"now"</span>
          <span style={{ color: t.text }}>)</span>
        </h1>
        <p style={styles.heroSub}>{'// Choose your battlefield. Prove your skills.'}</p>
      </div>

      {/* Sign-up CTA */}
      {!user && (
        <div style={{ ...styles.ctaWrap, padding: isMobile ? '16px' : '20px 24px 0' }}>
          <div style={{ ...styles.ctaPanel, flexDirection: isMobile ? 'column' : 'row' }}>
            <div>
              <div style={{ ...styles.panelTag, background: t.tagBg, color: t.textMuted }}>{'// new_here'}</div>
              <div style={{ ...styles.ctaText, color: t.text, fontSize: isMobile ? '12px' : '14px' }}>Sign up to save XP, climb the leaderboard & keep your streak.</div>
            </div>
            <div style={styles.ctaBtns}>
              <button onClick={() => navigate('/login')} style={styles.loginBtn}>login()</button>
              <button onClick={() => navigate('/register')} style={styles.registerBtn}>register()</button>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div style={{ ...styles.catsGrid, borderColor: t.border, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)' }}>
        {visibleCats.map((cat, i, arr) => (
          <div
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            style={{
              ...styles.catCard,
              background: t.cardAltBg,
              borderTop: `4px solid ${themeColor(cat.color, t)}`,
              borderRight: isMobile ? ((i % 2 === 0) ? `3px solid ${t.border}` : 'none') : (i < arr.length - 1 ? `3px solid ${t.border}` : 'none'),
              borderBottomColor: t.border,
              padding: isMobile ? '14px' : '18px 20px',
              ...(selectedCat === cat.id ? { background: t.isLight ? '#c5c2b5' : '#3e3d32', outline: `2px solid ${themeColor(cat.color, t)}`, outlineOffset: '-2px' } : {}),
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.isLight ? '#c5c2b5' : '#3e3d32'}
            onMouseLeave={e => e.currentTarget.style.background = selectedCat === cat.id ? (t.isLight ? '#c5c2b5' : '#3e3d32') : t.cardAltBg}
          >
            <div style={{ ...styles.catIcon, color: themeColor(cat.color, t), fontSize: isMobile ? '18px' : '22px' }}>{cat.short}</div>
            <div style={{ ...styles.catName, color: t.text }}>{cat.label}</div>
            <div style={{ ...styles.catCount, color: t.textMuted }}>{cat.count} questions</div>
            {user && cat.count > 0 && (
              <>
                <div style={{ ...styles.catBarTrack, background: t.isLight ? '#b8b5a8' : '#1e1f1a', borderColor: t.borderLight }}>
                  <div style={{ ...styles.catBarFill, width: `${(cat.solved / cat.count) * 100}%`, background: themeColor(cat.color, t) }} />
                </div>
                <div style={{ ...styles.catSolved, color: t.textMuted }}>{cat.solved}/{cat.count} solved</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Show more */}
      {categories.length > 4 && (
        <div style={{ ...styles.showMoreRow, borderBottomColor: t.border, background: t.cardBg }}>
          <button
            style={{ ...styles.showMoreBtn, color: t.green, borderColor: t.green }}
            onClick={() => setShowAllCats(v => !v)}
            onMouseEnter={e => { e.currentTarget.style.background = t.green; e.currentTarget.style.color = '#272822'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.green; }}
          >
            {showAllCats ? '− show less' : `+ show ${categories.length - 4} more`}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ ...styles.statsGrid, borderBottomColor: t.border, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{ ...styles.statCard, background: t.pageBg, borderRight: isMobile ? 'none' : (i < 2 ? `3px solid ${t.border}` : 'none'), borderBottom: isMobile && i < stats.length - 1 ? `2px solid ${t.border}` : 'none' }}>
            <div style={{ ...styles.statVal, color: themeColor(stat.color, t), fontSize: isMobile ? '22px' : '28px' }}>{stat.val}</div>
            <div style={{ ...styles.statLabel, color: t.textMuted }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Start */}
      <div style={{ ...styles.startRow, background: t.pageBg, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '0', padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: isMobile ? '100%' : 'auto' }}>
          <button
            style={{ ...styles.startBtn, boxShadow: t.shadow, width: isMobile ? '100%' : 'auto', fontSize: isMobile ? '12px' : '14px' }}
            onClick={handleStartQuiz}
            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
          >
            ▶ START QUIZ
          </button>
          {!user && !isMobile && (
            <span style={{ ...styles.loginNote, color: t.textMuted }}>{'// login required to play & save score'}</span>
          )}
        </div>
        {user && (
          <div style={{ ...styles.streak, color: t.yellow }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f92672" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-2-1-4-2-5 0 2-1 3-3 3s-2-2-2-3c0-2 2-4 2-4z" />
            </svg>
            {user?.streak || 0} day streak
          </div>
        )}
      </div>

      {/* Daily challenge + Top players */}
      <div style={{ ...styles.panelsGrid, gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', padding: isMobile ? '4px 16px 0' : '4px 24px 0' }}>

        {/* Daily challenge */}
        <div style={{ ...styles.panel, background: t.cardAltBg, borderColor: t.border }}>
          <div style={{ ...styles.panelTag, background: t.tagBg, color: t.textMuted }}>{'// daily_challenge'}</div>
          {daily ? (
            <>
              <div style={{ ...styles.dcTitle, color: t.text, fontSize: isMobile ? '14px' : '17px' }}>{daily.category?.name} challenge</div>
              <div style={{ ...styles.dcTags, flexWrap: 'wrap' }}>
                <span style={{ ...styles.dcPill, color: daily.category?.color || '#e6db74', borderColor: daily.category?.color || '#e6db74' }}>
                  {daily.category?.slug?.toUpperCase()}
                </span>
                <span style={{ ...styles.dcPill, color: '#f92672', borderColor: '#f92672' }}>
                  {daily.difficulty?.toUpperCase()}
                </span>
                <span style={{ ...styles.dcBonus, color: t.green }}>+{daily.bonusXP} BONUS XP</span>
              </div>
              <div style={{ ...styles.dcFooter, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0' }}>
                <span style={{ ...styles.dcTimer, color: t.textMuted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  resets in {formatCountdown(resetsIn)}
                </span>
                {daily.completedToday ? (
                  <span style={{ ...styles.dcDone, color: t.green, borderColor: t.green }}>✓ COMPLETED</span>
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
            <div style={{ ...styles.dcTimer, color: t.textMuted, marginTop: '12px' }}>
              {user ? '// no challenge set for today' : "// login to view today's challenge"}
            </div>
          )}
        </div>

        {/* Top players — real API data */}
        <div style={{ ...styles.panel, background: t.cardAltBg, borderColor: t.border }}>
          <div style={{ ...styles.panelTag, background: t.tagBg, color: t.textMuted }}>{'// top_players'}</div>
          <div style={{ marginTop: '10px' }}>
            {topPlayers.map((p, i) => (
              <div key={p._id} style={{
                ...styles.lbRow,
                color: t.text,
                ...(i === topPlayers.length - 1 ? { borderBottom: `2px dashed ${t.borderLight}`, paddingBottom: '8px' } : {}),
              }}>
                <span>
                  <span style={{ color: i === 0 ? '#e6db74' : i === 1 ? '#c0c0c0' : '#cd7f32' }}>#{i + 1}</span>
                  {' '}{p.username}
                </span>
                <span style={{ color: t.textMuted }}>{p.totalXP}</span>
              </div>
            ))}
            {user && myRank && (
              <div style={{ ...styles.lbRow, color: '#66d9e8', paddingTop: '8px' }}>
                <span>#{myRank.globalRank} you</span>
                <span>{myRank.totalXP}</span>
              </div>
            )}
          </div>
          <a onClick={() => navigate('/leaderboard')} style={{ ...styles.lbLink, color: t.textMuted }}>view full leaderboard →</a>
        </div>
      </div>

      {/* Recent activity — real API data */}
      {user && (
        <div style={{ ...styles.activityWrap, padding: isMobile ? '16px' : '16px 24px 0' }}>
          <div style={{ ...styles.activityPanel, background: t.cardAltBg }}>
            <div style={{ ...styles.panelTag, background: t.tagBg, color: t.textMuted }}>{'// recent_activity'}</div>
            <div style={{ ...styles.activityGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
              {recentActivity.length > 0 ? recentActivity.map((a) => (
                <div key={a._id} style={{ ...styles.activityCell, borderColor: t.borderLight }}>
                  <div style={{ ...styles.actTag, color: a.category?.color || '#e6db74' }}>
                    {a.category?.name || '?'} · {a.difficulty}
                  </div>
                  <div style={{ ...styles.actScore, color: t.text }}>
                    {a.correctAnswers}/10 <span style={{ ...styles.actXp, color: t.green }}>+{a.earnedXP} XP</span>
                  </div>
                  <div style={{ ...styles.actWhen, color: t.textMuted }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              )) : (
                <div style={{ color: t.textMuted, fontSize: '12px', gridColumn: '1/-1' }}>
                  // no_activity_yet — play a quiz!
                </div>
              )}
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
  hamburger: { fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, background: 'transparent', border: '2px solid #75715e', padding: '4px 10px', cursor: 'pointer' },
  mobileMenu: { width: '100%', borderTop: '2px solid #3e3d32', display: 'flex', flexDirection: 'column' },
  mobileMenuItem: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', textDecoration: 'none', borderBottom: '1px solid #3e3d32' },
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