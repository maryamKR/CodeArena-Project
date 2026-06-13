import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';
import api from '../api/axios';

const NAV_LINKS = [
  { label: 'Home',        path: '/' },
  { label: 'Dashboard',   path: '/dashboard' },
  { label: 'Quiz',        path: '/quiz' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Profile',     path: '/profile' },
];

const BADGE_COLORS = {
  'First Blood': '#f92672',
  'Perfect Score': '#e6db74',
  'Speed Demon': '#66d9e8',
  '10 Wins': '#a6e22e',
  'Centurion': '#e6db74',
  'XP Master': '#f92672',
  'Streak 3': '#66d9e8',
  'Streak 7': '#a6e22e',
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/history/${user?.username}`);
        setHistory(res.data.data || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchHistory();

    api.get('/leaderboard/me')
        .then(res => setMyRank(res.data.data))
        .catch(() => {});
    }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
                ...(i === 4 ? styles.navLinkActive : {}),
                ...(i === NAV_LINKS.length - 1 ? { borderRight: '2px solid #75715e' } : {}),
                cursor: 'pointer',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div style={styles.xpBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#272822" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          {user?.totalXP || 0} XP
        </div>
      </nav>

      <div style={styles.content}>

        {/* Header */}
        <div style={styles.tag}>{'// profile'}</div>
        <h1 style={styles.title}>
          <span style={styles.kw}>const</span> me{' '}
          <span style={styles.op}>=</span>{' '}
          <span style={styles.str}>"{user?.username}"</span>
        </h1>

        <div style={styles.mainGrid}>

          {/* Left column */}
          <div style={styles.leftCol}>

            {/* User card */}
            <div style={styles.userCard}>
              <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
              <div>
                <div style={styles.username}>{user?.username}</div>
                <div style={styles.email}>{user?.email}</div>
                <div style={styles.rankBadge}>{user?.rank || 'Beginner'}</div>
              </div>
            </div>

            {/* Stats */}
            <div style={styles.statsGrid}>
              {[
                { label: 'Total XP',    val: user?.totalXP || 0,          color: '#e6db74' },
                { label: 'Quizzes',     val: user?.quizzesPlayed || 0,    color: '#a6e22e' },
                { label: 'Global Rank', val: myRank ? `#${myRank.globalRank}` : '-', color: '#66d9e8' },
                { label: 'Badges',      val: user?.badges?.length || 0,   color: '#f92672' },
              ].map((stat) => (
                <div key={stat.label} style={styles.statCard}>
                  <div style={{ ...styles.statVal, color: stat.color }}>{stat.val}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Badges */}
            <div style={styles.section}>
              <div style={styles.sectionTag}>{'// badges_earned'}</div>
              <div style={styles.badgesWrap}>
                {user?.badges?.length > 0 ? user.badges.map((badge, i) => (
                  <div key={i} style={{ ...styles.badge, borderColor: BADGE_COLORS[badge] || '#75715e', color: BADGE_COLORS[badge] || '#75715e' }}>
                    {badge}
                  </div>
                )) : (
                  <div style={styles.emptyTag}>{'// no_badges_yet — play more quizzes!'}</div>
                )}
              </div>
            </div>

            {/* Logout */}
            <button style={styles.logoutBtn} onClick={handleLogout}>
              logout()
            </button>

          </div>

          {/* Right column — Quiz history */}
          <div style={styles.rightCol}>
            <div style={styles.sectionTag}>{'// quiz_history'}</div>
            {loading ? (
              <div style={styles.emptyTag}>{'// loading...'}</div>
            ) : history.length === 0 ? (
              <div style={styles.emptyTag}>{'// no_quizzes_played_yet'}</div>
            ) : (
              <div style={styles.historyWrap}>
                {history.map((h, i) => (
                  <div key={i} style={{ ...styles.historyRow, borderBottom: i < history.length - 1 ? '2px solid #3e3d32' : 'none' }}>
                    <div style={styles.historyLeft}>
                      <div style={styles.historyCategory}>{h.category?.name || '?'}</div>
                      <div style={styles.historyDiff}>{h.difficulty}</div>
                    </div>
                    <div style={styles.historyCenter}>
                      <div style={styles.historyScore}>
                        <span style={{ color: '#a6e22e' }}>{h.correctAnswers}</span>/10
                      </div>
                      <div style={styles.historyDate}>{new Date(h.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ ...styles.historyXP, color: '#e6db74' }}>+{h.earnedXP} XP</div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
  xpBadge: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: '#e6db74', color: '#272822', border: '2px solid #e6db74', padding: '4px 14px', display: 'flex', alignItems: 'center' },

  content: { padding: '28px 24px', maxWidth: '1000px', margin: '0 auto' },

  tag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '10px', letterSpacing: '2px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#f8f8f2', marginBottom: '28px' },
  kw: { color: '#66d9e8' },
  op: { color: '#f92672' },
  str: { color: '#e6db74' },

  mainGrid: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' },

  leftCol: { display: 'flex', flexDirection: 'column', gap: '16px' },

  userCard: { background: '#1e1f1a', border: '3px solid #75715e', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '4px 4px 0 #3e3d32' },
  avatar: { width: '60px', height: '60px', borderRadius: '50%', background: '#a6e22e', color: '#272822', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, flexShrink: 0 },
  username: { fontSize: '16px', fontWeight: 700, color: '#f8f8f2', marginBottom: '4px' },
  email: { fontSize: '11px', color: '#75715e', marginBottom: '8px' },
  rankBadge: { display: 'inline-block', background: 'rgba(166,226,46,0.15)', color: '#a6e22e', border: '1px solid #a6e22e', fontSize: '10px', fontWeight: 700, padding: '2px 8px', letterSpacing: '1px' },

  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '3px solid #75715e' },
  statCard: { padding: '14px', textAlign: 'center', background: '#1e1f1a', borderRight: '2px solid #75715e', borderBottom: '2px solid #75715e' },
  statVal: { fontSize: '22px', fontWeight: 700 },
  statLabel: { fontSize: '10px', color: '#75715e', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },

  section: { background: '#1e1f1a', border: '3px solid #75715e', padding: '16px' },
  sectionTag: { fontSize: '11px', background: '#3e3d32', color: '#75715e', display: 'inline-block', padding: '3px 10px', marginBottom: '12px', letterSpacing: '2px' },
  badgesWrap: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  badge: { fontSize: '11px', fontWeight: 700, padding: '4px 10px', border: '2px solid', letterSpacing: '1px', textTransform: 'uppercase' },
  emptyTag: { fontSize: '11px', color: '#75715e', fontStyle: 'italic' },

  logoutBtn: { fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, background: 'transparent', color: '#f92672', border: '2px solid #f92672', padding: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', width: '100%' },

  rightCol: { background: '#1e1f1a', border: '3px solid #75715e', padding: '20px', boxShadow: '4px 4px 0 #3e3d32' },
  historyWrap: { display: 'flex', flexDirection: 'column' },
  historyRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: '12px' },
  historyLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
  historyCategory: { fontSize: '13px', fontWeight: 700, color: '#f8f8f2', textTransform: 'uppercase' },
  historyDiff: { fontSize: '11px', color: '#75715e' },
  historyCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  historyScore: { fontSize: '16px', fontWeight: 700, color: '#f8f8f2' },
  historyDate: { fontSize: '10px', color: '#75715e' },
  historyXP: { fontSize: '13px', fontWeight: 700 },
};